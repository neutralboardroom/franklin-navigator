-- R1332 community reviews. Additive only; no profile/source authority transfer.
create table if not exists franklin_reviews(
  review_id text primary key,
  community text not null default 'FRANKLIN_TN' check(community='FRANKLIN_TN'),
  profile_id text not null,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  rating smallint not null check(rating between 1 and 5),
  title text not null default '',
  body text not null,
  experience_type text not null check(experience_type in ('USED_SERVICE','CONSULTED','VISITED','PURCHASED','OTHER_FIRSTHAND')),
  public_name text not null,
  state text not null default 'PUBLISHED' check(state in ('PUBLISHED','PENDING','REJECTED','REMOVED','DISPUTED')),
  automated_hold_reason text not null default '',
  moderation_reason text not null default '',
  owner_response text not null default '',
  owner_response_account_id text references franklin_accounts(account_id) on delete set null,
  owner_response_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  removed_at timestamptz,
  unique(account_id,profile_id)
);
create index if not exists franklin_reviews_profile_public_idx on franklin_reviews(profile_id,state,published_at desc,created_at desc);
create index if not exists franklin_reviews_moderation_idx on franklin_reviews(state,updated_at,review_id);

create table if not exists franklin_review_reports(
  report_id text primary key,
  review_id text not null references franklin_reviews(review_id) on delete cascade,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  reason text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  unique(review_id,account_id)
);
create index if not exists franklin_review_reports_review_idx on franklin_review_reports(review_id,created_at desc);

create table if not exists franklin_review_history(
  decision_id text primary key,
  review_id text not null references franklin_reviews(review_id) on delete cascade,
  actor_type text not null,
  actor_ref_hash text,
  action text not null,
  reason text not null default '',
  created_at timestamptz not null default now()
);
