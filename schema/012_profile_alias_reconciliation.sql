-- R1360 canonical profile alias registry. Additive and replay-safe.
create table if not exists franklin_profile_aliases(
  alias_profile_id text primary key,
  canonical_profile_id text not null,
  source_release text not null,
  source_artifact_sha256 text not null check(length(source_artifact_sha256)=64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(alias_profile_id<>canonical_profile_id)
);
create index if not exists franklin_profile_aliases_canonical_idx on franklin_profile_aliases(canonical_profile_id);
