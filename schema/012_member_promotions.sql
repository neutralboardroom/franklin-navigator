-- Franklin Navigator R1365 paid-member promotions/events.
-- Preserves free-profile rights; this schema stores only paid-member promotional content.
create table if not exists franklin_member_promotions (
  promotion_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  kind text not null check (kind in ('COUPON','SPECIAL','SALE','PROMOTION','EVENT')),
  title text not null,
  description text not null,
  promo_code text,
  discount_text text,
  action_url text,
  start_at timestamptz,
  end_at timestamptz,
  event_location text,
  state text not null default 'DRAFT' check (state in ('DRAFT','SUBMITTED','PUBLISHED','CHANGES_REQUESTED','UNPUBLISHED','ARCHIVED','REMOVED')),
  revision integer not null default 1 check (revision>0),
  idempotency_key text,
  public_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  published_at timestamptz,
  unpublished_at timestamptz,
  removed_at timestamptz
);
create unique index if not exists franklin_member_promotions_idempotency
  on franklin_member_promotions(account_id,profile_id,idempotency_key)
  where idempotency_key is not null;
create index if not exists franklin_member_promotions_public
  on franklin_member_promotions(profile_id,state,end_at,published_at);

create table if not exists franklin_member_promotion_media (
  media_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  promotion_id text not null references franklin_member_promotions(promotion_id) on delete cascade,
  account_id text not null references franklin_accounts(account_id) on delete cascade,
  profile_id text not null,
  media_kind text not null check (media_kind in ('COUPON_GRAPHIC','SALE_GRAPHIC','PROMOTIONAL_GRAPHIC','PROMOTIONAL_FLYER','EVENT_FLYER')),
  mime_type text not null check (mime_type='image/webp'),
  byte_size integer not null check (byte_size>0 and byte_size<=4194304),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  content bytea not null,
  state text not null default 'DRAFT' check (state in ('DRAFT','SUBMITTED','PUBLISHED','CHANGES_REQUESTED','REMOVED')),
  rights_confirmed_at timestamptz,
  public_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  published_at timestamptz,
  removed_at timestamptz
);
create index if not exists franklin_member_promotion_media_lookup
  on franklin_member_promotion_media(promotion_id,state,updated_at);

create table if not exists franklin_member_promotion_review_history (
  decision_id text primary key,
  community text not null check (community='FRANKLIN_TN'),
  item_type text not null check (item_type in ('PROMOTION','MEDIA')),
  item_id text not null,
  account_id text not null,
  profile_id text not null,
  decision text not null,
  reviewer_hash text not null,
  public_reason text,
  evidence_notes_sha256 text,
  decided_at timestamptz not null default now()
);
create index if not exists franklin_member_promotion_review_history_item
  on franklin_member_promotion_review_history(item_type,item_id,decided_at desc);
