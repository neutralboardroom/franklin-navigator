begin;

create table if not exists schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now(),
  sha256 text not null
);

create table if not exists member_accounts (
  account_id uuid primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  email_normalized text not null,
  email_verified_at timestamptz,
  password_hash text not null,
  preferred_language text not null default 'ENGLISH' check (preferred_language in ('ENGLISH','SPANISH')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','LOCKED','CLOSED')),
  failed_login_count integer not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community, email_normalized)
);

create table if not exists member_sessions (
  session_id uuid primary key,
  account_id uuid not null references member_accounts(account_id) on delete cascade,
  token_hash text not null unique,
  csrf_hash text not null,
  user_agent_hash text,
  ip_hash text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists member_sessions_account_idx on member_sessions(account_id, expires_at desc);

create table if not exists member_organizations (
  organization_id uuid primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  legal_or_display_name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','UNDER_REVIEW','CLOSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_members (
  organization_id uuid not null references member_organizations(organization_id) on delete cascade,
  account_id uuid not null references member_accounts(account_id) on delete cascade,
  role text not null default 'OWNER' check (role in ('OWNER','ADMIN','MEMBER')),
  created_at timestamptz not null default now(),
  primary key (organization_id, account_id)
);

create table if not exists profile_links (
  profile_link_id uuid primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  organization_id uuid not null references member_organizations(organization_id) on delete cascade,
  franklin_profile_id text not null,
  subscribed_location_id text not null,
  claim_state text not null default 'PENDING' check (claim_state in ('PENDING','VERIFIED','DISPUTED','RELEASED')),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (community, franklin_profile_id, subscribed_location_id)
);

create table if not exists checkout_intents (
  checkout_intent_id uuid primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  account_id uuid not null references member_accounts(account_id) on delete restrict,
  organization_id uuid not null references member_organizations(organization_id) on delete restrict,
  profile_link_id uuid not null references profile_links(profile_link_id) on delete restrict,
  lookup_key text not null,
  vertical text not null,
  tier text not null check (tier in ('individual','team','office')),
  billing_interval text not null check (billing_interval in ('monthly','annual')),
  promotion_code text,
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  state text not null default 'CREATED' check (state in ('CREATED','REDIRECT_READY','PENDING','SETTLED','FAILED','EXPIRED','CANCELED')),
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);
create index if not exists checkout_intents_account_idx on checkout_intents(account_id, created_at desc);

create table if not exists member_subscriptions (
  subscription_id uuid primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  account_id uuid not null references member_accounts(account_id) on delete restrict,
  organization_id uuid not null references member_organizations(organization_id) on delete restrict,
  profile_link_id uuid not null references profile_links(profile_link_id) on delete restrict,
  checkout_intent_id uuid references checkout_intents(checkout_intent_id) on delete set null,
  lookup_key text not null,
  vertical text not null,
  tier text not null check (tier in ('individual','team','office')),
  billing_interval text not null check (billing_interval in ('monthly','annual')),
  promotion_code text,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_checkout_session_id text unique,
  state text not null default 'PENDING' check (state in ('PENDING','ACTIVE','GRACE','SUSPENDED','CANCELING','TERMINATED','REFUNDED','DISPUTED')),
  state_reason text,
  access_active boolean not null default false,
  cancel_at_period_end boolean not null default false,
  current_period_end timestamptz,
  cancel_effective_at timestamptz,
  grace_ends_at timestamptz,
  activated_at timestamptz,
  renewed_at timestamptz,
  payment_failed_at timestamptz,
  suspended_at timestamptz,
  terminated_at timestamptz,
  refunded_at timestamptz,
  disputed_at timestamptz,
  last_event_created bigint not null default 0,
  last_event_type text,
  latest_invoice_id text,
  requires_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_subscriptions_account_idx on member_subscriptions(account_id, updated_at desc);
create index if not exists member_subscriptions_customer_idx on member_subscriptions(stripe_customer_id);
create index if not exists member_subscriptions_profile_idx on member_subscriptions(profile_link_id, updated_at desc);

create table if not exists member_entitlements (
  entitlement_id uuid primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  subscription_id uuid not null unique references member_subscriptions(subscription_id) on delete cascade,
  account_id uuid not null references member_accounts(account_id) on delete restrict,
  profile_link_id uuid not null references profile_links(profile_link_id) on delete restrict,
  state text not null,
  active boolean not null,
  tier text,
  vertical text,
  billing_interval text,
  effective_at timestamptz not null,
  expires_at timestamptz,
  reason text,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists member_entitlements_account_idx on member_entitlements(account_id, active, updated_at desc);

create table if not exists commerce_event_ledger (
  event_id text primary key,
  source text not null check (source in ('STRIPE','SRE','LOCAL_RECONCILIATION')),
  event_type text not null,
  livemode boolean not null default false,
  event_created bigint not null default 0,
  payload_sha256 text not null,
  signature_verified boolean not null,
  community text,
  checkout_intent_id uuid,
  account_id uuid,
  subscription_id uuid,
  stripe_customer_id text,
  stripe_subscription_id text,
  processing_state text not null default 'RECEIVED' check (processing_state in ('RECEIVED','PROCESSING','PROCESSED','IGNORED_DUPLICATE','IGNORED_STALE','IGNORED_UNSUPPORTED','RETRY_PENDING','DEAD_LETTER')),
  attempt_count integer not null default 0,
  next_retry_at timestamptz,
  last_error_code text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists commerce_event_retry_idx on commerce_event_ledger(processing_state, next_retry_at);
create index if not exists commerce_event_subscription_idx on commerce_event_ledger(subscription_id, received_at desc);

create table if not exists commerce_dead_letters (
  dead_letter_id uuid primary key,
  event_id text not null unique references commerce_event_ledger(event_id) on delete cascade,
  event_type text not null,
  error_code text not null,
  error_summary text not null,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_summary text
);

create table if not exists member_onboarding (
  onboarding_id uuid primary key,
  subscription_id uuid not null unique references member_subscriptions(subscription_id) on delete cascade,
  account_confirmation_at timestamptz,
  profile_link_reviewed_at timestamptz,
  benefits_selected_at timestamptz,
  growth_desk_ready_at timestamptz,
  support_access_reviewed_at timestamptz,
  first_value_at timestamptz,
  selected_benefits jsonb not null default '[]'::jsonb,
  preferred_language text not null default 'ENGLISH',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admin_exceptions (
  exception_id uuid primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  exception_type text not null,
  state text not null default 'OPEN' check (state in ('OPEN','REVIEWING','RESOLVED')),
  priority text not null default 'HIGH' check (priority in ('LOW','MEDIUM','HIGH','CRITICAL')),
  account_id uuid,
  subscription_id uuid,
  event_id text,
  summary text not null,
  safe_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists admin_exceptions_open_idx on admin_exceptions(state, priority, created_at desc);

create table if not exists audit_events (
  audit_id bigserial primary key,
  community text not null default 'FRANKLIN_TN' check (community = 'FRANKLIN_TN'),
  actor_type text not null,
  actor_ref_hash text,
  action text not null,
  object_type text,
  object_ref text,
  outcome text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_object_idx on audit_events(object_type, object_ref, created_at desc);

insert into schema_migrations(version, sha256)
values ('002_live_membership', 'PENDING_RUNTIME_VERIFICATION')
on conflict (version) do nothing;

commit;
