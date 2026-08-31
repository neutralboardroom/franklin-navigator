begin;

create table if not exists account_action_tokens (
  action_token_id uuid primary key,
  account_id uuid not null references member_accounts(account_id) on delete cascade,
  action_type text not null check (action_type in ('VERIFY_EMAIL','RESET_PASSWORD')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists account_action_tokens_account_idx on account_action_tokens(account_id, action_type, created_at desc);

alter table commerce_event_ledger add column if not exists payload jsonb not null default '{}'::jsonb;
alter table commerce_event_ledger add column if not exists lease_until timestamptz;
alter table commerce_event_ledger add column if not exists updated_at timestamptz not null default now();

create table if not exists checkout_price_bindings (
  lookup_key text primary key,
  stripe_price_id text not null,
  stripe_product_id text not null,
  currency text not null,
  unit_amount bigint not null,
  recurring_interval text not null,
  active boolean not null,
  observed_at timestamptz not null default now(),
  provider_payload_sha256 text not null
);

create table if not exists reconciliation_runs (
  reconciliation_id uuid primary key,
  scope text not null,
  state text not null check (state in ('STARTED','PASS','FAIL')),
  inspected_count integer not null default 0,
  corrected_count integer not null default 0,
  exception_count integer not null default 0,
  safe_summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

insert into schema_migrations(version, sha256)
values ('003_auth_retry', 'PENDING_RUNTIME_VERIFICATION')
on conflict (version) do nothing;

commit;
