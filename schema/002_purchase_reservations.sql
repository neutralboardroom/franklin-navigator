-- Additive migration. Retain this table during rollback; never delete purchase history.
create table if not exists franklin_purchase_reservations(
 reservation_key text primary key,
 context text not null check(context='FRANKLIN_TN:LIVE'),
 account_id text not null references franklin_accounts(account_id) on delete cascade,
 profile_id text not null,
 lookup_key text not null,
 intent_id text not null unique references franklin_checkout_intents(intent_id),
 request_snapshot jsonb not null,
 state text not null check(state in ('RESERVED','CREATING','READY','OUTCOME_UNKNOWN','REVIEW_REQUIRED')),
 lease_token text,
 lease_until timestamptz,
 first_attempt_at timestamptz,
 attempt_count integer not null default 0,
 checkout_session_id text,
 checkout_url text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(context,account_id,profile_id)
);
create index if not exists franklin_purchase_review_idx on franklin_purchase_reservations(state,updated_at);
