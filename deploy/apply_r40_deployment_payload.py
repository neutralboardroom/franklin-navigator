#!/usr/bin/env python3
from pathlib import Path, PurePosixPath
import hashlib, io, json, shutil, stat, tarfile, tempfile, zipfile

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD = ROOT / "deploy" / "R40_GITHUB_DEPLOYMENT_PAYLOAD.zip"
EXPECTED_PAYLOAD_SHA256 = "3caa9d111e5401a18c86a424b51481fd9be5a87436766c0a2b773b698f2e3f8a"
EXPECTED_TARGZ_SHA256 = "baa2a64b63056c01c981b0fdad5ccc4463341b92e888c2d2855ed4a78f113046"
EXPECTED_DIST_MANIFEST_SHA256 = "9a2a395331d3c5ceda601c090e34d658275d3f8f827af6b94308f17c37d8ec0e"
EXPECTED_RELEASE = "FR-NAV1.15.0-CANDIDATE-R40"
EXPECTED_RELEASE_ZIP_SHA256 = "8cbadeeb187386e2825098fe28c395035e5ef00fe1e9be6a2181657be14cfefc"
EXPECTED_SOURCE_TREE_SHA256 = "f0ffaa860b8e0f81737a8bc2f71eb8c64edd8043cfebd1c14ed5e18f15663de9"
EXPECTED_ROLLBACK_COMMIT = "b254b3d83f03935e4337ff2d19f6f7e773c16158"
EXPECTED_ROLLBACK_DEPLOY = "dep-daem2kv40ujc73fprnfg"
EXPECTED_DIST_FILES = 19481
ALLOWED_OUTER = {"R40_STATIC_DIST.tar.gz", "R40_DEPLOYMENT_PAYLOAD.json", "README_UPLOAD.txt"}


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
    raise SystemExit("R40 deployment payload is missing")
if sha_file(PAYLOAD) != EXPECTED_PAYLOAD_SHA256:
    raise SystemExit("R40 deployment payload SHA-256 mismatch")

with zipfile.ZipFile(PAYLOAD) as outer:
    names = outer.namelist()
    if len(names) != len(set(names)) or set(names) != ALLOWED_OUTER:
        raise SystemExit("R40 deployment payload member set mismatch")
    if any(not safe_member(name) for name in names):
        raise SystemExit("Unsafe R40 outer ZIP member")
    if outer.testzip() is not None:
        raise SystemExit("R40 deployment payload CRC failure")
    for info in outer.infolist():
        mode = info.external_attr >> 16
        if stat.S_ISLNK(mode):
            raise SystemExit(f"R40 outer ZIP symlink rejected: {info.filename}")
    meta = json.loads(outer.read("R40_DEPLOYMENT_PAYLOAD.json"))
    required = {
        "release": EXPECTED_RELEASE,
        "sealedReleaseZipSha256": EXPECTED_RELEASE_ZIP_SHA256,
        "sourceTreeSha256": EXPECTED_SOURCE_TREE_SHA256,
        "staticTarGzSha256": EXPECTED_TARGZ_SHA256,
        "distManifestSha256": EXPECTED_DIST_MANIFEST_SHA256,
        "distFileCount": EXPECTED_DIST_FILES,
        "publicCheckoutOpen": False,
        "rollbackTargetCommit": EXPECTED_ROLLBACK_COMMIT,
        "rollbackTargetDeployId": EXPECTED_ROLLBACK_DEPLOY,
    }
    for key, expected in required.items():
        if meta.get(key) != expected:
            raise SystemExit(f"R40 deployment payload metadata mismatch: {key}")
    tgz = outer.read("R40_STATIC_DIST.tar.gz")

if sha_bytes(tgz) != EXPECTED_TARGZ_SHA256:
    raise SystemExit("R40 static tar.gz SHA-256 mismatch")

with tempfile.TemporaryDirectory(prefix="franklin-r40-") as td:
    work = Path(td)
    with tarfile.open(fileobj=io.BytesIO(tgz), mode="r:gz") as tar:
        members = tar.getmembers()
        for m in members:
            if not safe_member(m.name) or m.issym() or m.islnk() or not (m.isfile() or m.isdir()):
                raise SystemExit(f"Unsafe R40 tar member: {m.name}")
        tar.extractall(work, filter="data")

    manifest_path = work / "R40_DIST_MANIFEST.json"
    if sha_file(manifest_path) != EXPECTED_DIST_MANIFEST_SHA256:
        raise SystemExit("R40 dist manifest SHA-256 mismatch")
    manifest = json.loads(manifest_path.read_text("utf-8"))
    if manifest.get("release") != EXPECTED_RELEASE or manifest.get("sealedArtifactSha256") != EXPECTED_RELEASE_ZIP_SHA256:
        raise SystemExit("R40 dist manifest release binding mismatch")
    expected = {row["path"]: row for row in manifest["files"]}
    actual = {p.relative_to(work).as_posix(): p for p in (work / "dist").rglob("*") if p.is_file()}
    if len(expected) != EXPECTED_DIST_FILES or manifest.get("fileCount") != EXPECTED_DIST_FILES or set(expected) != set(actual):
        raise SystemExit("R40 dist file set mismatch")
    for rel, path in actual.items():
        row = expected[rel]
        if path.stat().st_size != row["bytes"] or sha_file(path) != row["sha256"]:
            raise SystemExit(f"R40 dist verification failed: {rel}")

    build_manifest = json.loads((work / "dist" / "FRANKLIN_BUILD_MANIFEST.json").read_text("utf-8"))
    if build_manifest.get("release") != EXPECTED_RELEASE:
        raise SystemExit("R40 build manifest identity mismatch")
    if build_manifest.get("commerce", {}).get("publicCheckoutOpen") is not False:
        raise SystemExit("R40 public checkout must remain closed")

    target = ROOT / "dist"
    if target.exists():
        shutil.rmtree(target)
    shutil.move(str(work / "dist"), str(target))

print(f"R40_DEPLOYMENT_PAYLOAD_APPLIED_PASS files={EXPECTED_DIST_FILES} release={EXPECTED_RELEASE}")
