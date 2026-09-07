-- Additive migration. Never drop member edits, review decisions or audit history on rollback.
create table if not exists franklin_representation_reviews (
  request_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  account_id text not null references franklin_accounts(account_id),
  profile_id text not null,
  revision integer not null check (revision>0),
  state text not null check (state in ('PENDING','VERIFIED','CHANGES_REQUESTED','REJECTED','REVOKED')),
  evidence_url text not null,
  statement text not null,
  public_reason text not null default '',
  reviewed_by_hash text,
  evidence_receipt text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,profile_id)
);
create index if not exists franklin_representation_queue on franklin_representation_reviews(state,updated_at,request_id);
create table if not exists franklin_member_drafts (
  account_id text not null references franklin_accounts(account_id),
  profile_id text not null,
  community text not null check (community='FRANKLIN_TN'),
  revision integer not null check (revision>0),
  state text not null check (state in ('DRAFT','SUBMITTED','CHANGES_REQUESTED','PUBLISHED','REMOVED')),
  fields jsonb not null check (jsonb_typeof(fields)='object'),
  fields_sha256 text not null,
  rights_confirmed_at timestamptz,
  public_reason text not null default '',
  updated_at timestamptz not null default now(),
  primary key(account_id,profile_id)
);
create index if not exists franklin_member_review_queue on franklin_member_drafts(state,updated_at,account_id,profile_id);
create table if not exists franklin_member_publications (
  profile_id text primary key,
  account_id text not null references franklin_accounts(account_id),
  community text not null check (community='FRANKLIN_TN'),
  revision integer not null,
  fields jsonb not null,
  fields_sha256 text not null,
  evidence_receipt text not null,
  reviewed_by_hash text not null,
  published_at timestamptz not null default now(),
  removed_at timestamptz
);
create table if not exists franklin_member_review_history (
  decision_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  kind text not null check (kind in ('REPRESENTATION','CONTENT')),
  account_id text not null references franklin_accounts(account_id),
  profile_id text not null,
  revision integer not null,
  decision text not null,
  evidence_receipt text not null,
  reviewer_hash text not null,
  public_reason text not null,
  fields_sha256 text,
  decided_at timestamptz not null default now()
);

-- An explicit account acknowledgement of the current reviewed public result, not a checkbox.
create table if not exists franklin_member_value_receipts (
  membership_id text not null references franklin_memberships(membership_id),
  community text not null default 'FRANKLIN_TN' check (community='FRANKLIN_TN'),
  account_id text not null references franklin_accounts(account_id),
  profile_id text not null,
  revision integer not null check(revision>0),
  fields_sha256 text not null,
  acknowledged_at timestamptz not null default now(),
  primary key(membership_id,revision)
);
