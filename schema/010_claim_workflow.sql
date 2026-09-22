-- R1358 additive claim-workflow history and notification ledger.
-- Claim decisions remain authoritative even when notification delivery fails.
create table if not exists franklin_representation_submissions(
  community text not null default 'FRANKLIN_TN' check(community='FRANKLIN_TN'),
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  revision integer not null check(revision>0),
  evidence_url text not null,
  statement text not null,
  submitted_at timestamptz not null default now(),
  primary key(account_id,profile_id,revision)
);
create index if not exists franklin_representation_submissions_profile_idx
  on franklin_representation_submissions(profile_id,submitted_at desc,account_id,revision desc);

create table if not exists franklin_claim_notification_log(
  notification_id text primary key,
  community text not null default 'FRANKLIN_TN' check(community='FRANKLIN_TN'),
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  revision integer not null check(revision>0),
  decision text not null,
  channel text not null default 'EMAIL' check(channel='EMAIL'),
  delivery_state text not null check(delivery_state in ('SENT','FAILED','NOT_CONFIGURED')),
  provider_message_id text,
  failure_code text,
  created_at timestamptz not null default now()
);
create index if not exists franklin_claim_notification_profile_idx
  on franklin_claim_notification_log(account_id,profile_id,created_at desc);
