create extension if not exists pgcrypto;
create table if not exists franklin_schema_migrations(
  version text primary key,
  digest_sha256 text not null,
  applied_at timestamptz not null default now()
);
create table if not exists franklin_accounts(
  account_id text primary key,
  community text not null check(community='FRANKLIN_TN'),
  email text not null,
  email_normalized text not null unique,
  password_hash text not null,
  display_name text,
  preferred_language text not null default 'ENGLISH',
  email_verified_at timestamptz,
  state text not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists franklin_sessions(
  session_hash text primary key,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  expires_at timestamptz not null,
  ip_prefix_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists franklin_sessions_account_idx on franklin_sessions(account_id,expires_at desc);
create table if not exists franklin_recovery_tokens(
  token_hash text primary key,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  purpose text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists franklin_profile_links(
  link_id text primary key,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  authority_state text not null default 'PENDING' check(authority_state in ('PENDING','VERIFIED','DISPUTED','REVOKED')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,profile_id)
);
create index if not exists franklin_profile_links_profile_idx on franklin_profile_links(profile_id,authority_state);
create table if not exists franklin_payment_links(
  lookup_key text primary key,
  payment_link_id text not null unique,
  url text not null,
  active boolean not null default true,
  validated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists franklin_checkout_intents(
  intent_id text primary key,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  lookup_key text not null,
  state text not null default 'CREATED',
  stripe_checkout_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists franklin_checkout_intents_account_idx on franklin_checkout_intents(account_id,created_at desc);
create table if not exists franklin_memberships(
  membership_id text primary key,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  lookup_key text not null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null,
  failure_count integer not null default 0,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  last_event_created bigint not null default 0,
  first_value_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id,profile_id)
);
create index if not exists franklin_memberships_customer_idx on franklin_memberships(stripe_customer_id);
create table if not exists franklin_entitlements(
  membership_id text primary key references franklin_memberships(membership_id) on delete cascade,
  access_state text not null,
  growth_desk boolean not null default false,
  rich_profile boolean not null default false,
  local_visibility_tools boolean not null default false,
  effective_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);
create table if not exists franklin_event_ledger(
  event_key text primary key,
  source text not null,
  event_type text not null,
  payload_sha256 text not null,
  event_created bigint not null default 0,
  processing_state text not null,
  account_id text,
  membership_id text,
  safe_context jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
create table if not exists franklin_dead_letters(
  dead_letter_id text primary key,
  source_event_key text,
  reason_code text not null,
  state text not null default 'OPEN',
  safe_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create table if not exists franklin_support_requests(
  request_id text primary key,
  account_id text references franklin_accounts(account_id) on delete set null,
  profile_id text,
  category text not null,
  message text not null,
  preferred_language text not null default 'ENGLISH',
  state text not null default 'OPEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists franklin_onboarding(
  account_id text primary key references franklin_accounts(account_id) on delete cascade,
  profile_id text,
  organization_name text,
  selected_benefits jsonb not null default '[]'::jsonb,
  preferred_language text not null default 'ENGLISH',
  profile_ready boolean not null default false,
  growth_desk_ready boolean not null default false,
  first_value_completed_at timestamptz,
  updated_at timestamptz not null default now()
);
create table if not exists franklin_audit_log(
  audit_id text primary key,
  actor_type text not null,
  actor_ref_hash text,
  action_type text not null,
  target_type text,
  target_ref_hash text,
  request_id text,
  safe_context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
