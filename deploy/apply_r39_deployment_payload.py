#!/usr/bin/env python3
from pathlib import Path, PurePosixPath
import hashlib, io, json, shutil, stat, tarfile, tempfile, zipfile

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = ROOT / "deploy" / "R39_GITHUB_DEPLOYMENT_PAYLOAD.zip"
EXPECTED_PAYLOAD_SHA256 = "89ca122f543c330bbd9bc09f6f0465149b589bb78fa6ed82d1ffa9e022e5e664"
EXPECTED_TARGZ_SHA256 = "4ced320f1f080a9adbbfcd6fc3dd43a6b2885570e587707846fe0a18d11d9fc0"
EXPECTED_RELEASE = "FR-NAV1.14.0-CANDIDATE-R39"
EXPECTED_RELEASE_ZIP_SHA256 = "1f40073f442877e1f5be7ff06f0517a82a96a0e97098cde40d1de199fcf9d151"
EXPECTED_DIST_FILES = 19481
ALLOWED_OUTER = {"R39_STATIC_DIST.tar.gz", "R39_DEPLOYMENT_PAYLOAD.json", "README_UPLOAD.txt"}

def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()

def sha_file(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()

def safe_member(name):
    p = PurePosixPath(name)
    return not name.startswith("/") and ".." not in p.parts and "\\" not in name

if not PAYLOAD.is_file():
    raise SystemExit("R39 deployment payload is missing")
if sha_file(PAYLOAD) != EXPECTED_PAYLOAD_SHA256:
    raise SystemExit("R39 deployment payload SHA-256 mismatch")

with zipfile.ZipFile(PAYLOAD) as outer:
    names = outer.namelist()
    if len(names) != len(set(names)) or set(names) != ALLOWED_OUTER:
        raise SystemExit("R39 deployment payload member set mismatch")
    if outer.testzip() is not None:
        raise SystemExit("R39 deployment payload CRC failure")
    meta = json.loads(outer.read("R39_DEPLOYMENT_PAYLOAD.json"))
    if meta.get("release") != EXPECTED_RELEASE or meta.get("sealedReleaseZipSha256") != EXPECTED_RELEASE_ZIP_SHA256:
        raise SystemExit("R39 deployment payload release binding mismatch")
    tgz = outer.read("R39_STATIC_DIST.tar.gz")

if sha_bytes(tgz) != EXPECTED_TARGZ_SHA256:
    raise SystemExit("R39 static tar.gz SHA-256 mismatch")

with tempfile.TemporaryDirectory(prefix="franklin-r39-") as td:
    work = Path(td)
    with tarfile.open(fileobj=io.BytesIO(tgz), mode="r:gz") as tar:
        members = tar.getmembers()
        for m in members:
            if not safe_member(m.name) or m.issym() or m.islnk() or not (m.isfile() or m.isdir()):
                raise SystemExit(f"Unsafe R39 tar member: {m.name}")
        tar.extractall(work, filter="data")

    manifest_path = work / "R39_DIST_MANIFEST.json"
    manifest = json.loads(manifest_path.read_text("utf-8"))
    if manifest.get("release") != EXPECTED_RELEASE or manifest.get("sealedArtifactSha256") != EXPECTED_RELEASE_ZIP_SHA256:
        raise SystemExit("R39 dist manifest release binding mismatch")
    expected = {row["path"]: row for row in manifest["files"]}
    actual = {p.relative_to(work).as_posix(): p for p in (work / "dist").rglob("*") if p.is_file()}
    if len(expected) != EXPECTED_DIST_FILES or set(expected) != set(actual):
        raise SystemExit("R39 dist file set mismatch")
    for rel, p in actual.items():
        row = expected[rel]
        if p.stat().st_size != row["bytes"] or sha_file(p) != row["sha256"]:
            raise SystemExit(f"R39 dist verification failed: {rel}")

    build_manifest = json.loads((work / "dist" / "FRANKLIN_BUILD_MANIFEST.json").read_text("utf-8"))
    if build_manifest.get("release") != EXPECTED_RELEASE:
        raise SystemExit("R39 build manifest identity mismatch")
    if build_manifest.get("commerce", {}).get("publicCheckoutOpen") is not False:
        raise SystemExit("R39 public checkout must remain closed")

    target = ROOT / "dist"
    if target.exists():
        shutil.rmtree(target)
    shutil.move(str(work / "dist"), str(target))

print(f"R39_DEPLOYMENT_PAYLOAD_APPLIED_PASS files={EXPECTED_DIST_FILES} release={EXPECTED_RELEASE}")
