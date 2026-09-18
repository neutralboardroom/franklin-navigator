-- R1330 additive reviewed profile-media storage. No existing profile/member state is removed.
create table if not exists franklin_member_media (
  media_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  slot text not null check (slot in ('PROFILE','COVER','GALLERY')),
  position integer not null default 0 check (position between 0 and 7),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  byte_size integer not null check (byte_size between 1 and 5242880),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  content bytea not null,
  state text not null check (state in ('DRAFT','SUBMITTED','CHANGES_REQUESTED','PUBLISHED','REMOVED')),
  rights_confirmed_at timestamptz,
  public_reason text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  removed_at timestamptz
);
create index if not exists franklin_member_media_owner_idx on franklin_member_media(account_id,profile_id,state,slot,position,updated_at desc);
create index if not exists franklin_member_media_review_queue on franklin_member_media(state,updated_at,media_id);
create index if not exists franklin_member_media_public_idx on franklin_member_media(profile_id,state,slot,position,published_at desc);

create table if not exists franklin_member_media_review_history (
  decision_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  media_id text not null,
  account_id text not null references franklin_accounts(account_id),
  profile_id text not null,
  decision text not null,
  evidence_sha256 text not null,
  evidence_notes text not null,
  reviewer_hash text not null,
  public_reason text not null,
  decided_at timestamptz not null default now()
);
create index if not exists franklin_member_media_history_idx on franklin_member_media_review_history(profile_id,account_id,decided_at desc);
