-- Local reviewer access only. No changes to source profiles, member benefits or payments.
-- Rollback retains decisions/evidence; expiring review sessions may be purged independently.
create table if not exists franklin_review_sessions (
  session_hash text primary key,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  community text not null default 'FRANKLIN_TN' check (community='FRANKLIN_TN'),
  reviewer_id text not null,
  binding_sha256 text not null check (length(binding_sha256)=64),
  credential_sha256 text not null check (length(credential_sha256)=64),
  csrf_hash text not null check (length(csrf_hash)=64),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists franklin_review_sessions_expiry on franklin_review_sessions(expires_at);
create table if not exists franklin_review_evidence (
  decision_id text primary key references franklin_member_review_history(decision_id),
  community text not null default 'FRANKLIN_TN' check (community='FRANKLIN_TN'),
  evidence_notes text not null check (length(evidence_notes) between 30 and 4000),
  evidence_sha256 text not null check (length(evidence_sha256)=64),
  reviewed_at timestamptz not null default now()
);
