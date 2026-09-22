-- R1359 verified-manager direct profile maintenance.
-- Additive only: preserve prior manager fields and immutable history.
alter table franklin_profile_links
  add column if not exists manager_fields jsonb not null default '{}'::jsonb,
  add column if not exists manager_revision integer not null default 0,
  add column if not exists manager_updated_at timestamptz;

create table if not exists franklin_manager_profile_history (
  history_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  account_id text not null references franklin_accounts(account_id),
  profile_id text not null,
  revision integer not null check (revision>0),
  action text not null check (action in ('PUBLISH','REVERT')),
  fields jsonb not null check (jsonb_typeof(fields)='object'),
  fields_sha256 text not null,
  previous_fields_sha256 text,
  created_at timestamptz not null default now(),
  unique(account_id,profile_id,revision)
);
create index if not exists franklin_manager_profile_history_lookup
  on franklin_manager_profile_history(account_id,profile_id,revision desc);
create index if not exists franklin_manager_profile_public_lookup
  on franklin_profile_links(profile_id,authority_state,manager_updated_at desc)
  where manager_revision>0;
