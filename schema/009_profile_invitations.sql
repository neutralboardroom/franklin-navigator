-- Secure, one-time outreach invitations. Inbox control is distinct from profile authority.
create table if not exists franklin_profile_invitations(
  invitation_id text primary key,
  community text not null default 'FRANKLIN_TN' check(community='FRANKLIN_TN'),
  profile_id text not null,
  email_normalized text not null,
  token_hash text not null unique check(length(token_hash)=64),
  source text not null default 'OWNER_OUTREACH',
  state text not null default 'PENDING' check(state in ('PENDING','CONSUMED','REVOKED')),
  account_id text references franklin_accounts(account_id) on delete set null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists franklin_profile_invitations_lookup_idx
  on franklin_profile_invitations(email_normalized,profile_id,state,expires_at desc);
create index if not exists franklin_profile_invitations_expiry_idx
  on franklin_profile_invitations(state,expires_at);
