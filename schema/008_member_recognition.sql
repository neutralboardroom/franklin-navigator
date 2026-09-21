create table if not exists franklin_member_recognition_years(
  recognition_id text primary key,
  membership_id text not null,
  account_id text not null,
  profile_id text not null,
  recognition_year integer not null check(recognition_year between 2020 and 2100),
  recognition_state text not null default 'HISTORICAL' check(recognition_state in ('ACTIVE','HISTORICAL')),
  qualified_at timestamptz not null default now(),
  last_qualified_at timestamptz not null default now(),
  last_authoritative_status text,
  source_event_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id,recognition_year)
);
create index if not exists franklin_member_recognition_profile_idx on franklin_member_recognition_years(profile_id,recognition_year desc);
create index if not exists franklin_member_recognition_membership_idx on franklin_member_recognition_years(membership_id,recognition_year desc);

create table if not exists franklin_member_decal_fulfillment(
  fulfillment_id text primary key,
  recognition_id text not null unique references franklin_member_recognition_years(recognition_id) on delete restrict,
  membership_id text not null,
  account_id text not null,
  profile_id text not null,
  recognition_year integer not null check(recognition_year between 2020 and 2100),
  status text not null check(status in ('NOT_ELIGIBLE','ELIGIBLE_ADDRESS_NEEDED','ELIGIBLE_READY','FULFILLMENT_REQUESTED','FULFILLED','REPLACEMENT_REVIEW','NOT_OFFERED','OUT_OF_STOCK')),
  mailing_address jsonb not null default '{}'::jsonb,
  mailing_address_confirmed_at timestamptz,
  requested_at timestamptz,
  fulfilled_at timestamptz,
  quantity_fulfilled integer not null default 0 check(quantity_fulfilled between 0 and 1),
  replacement_requested_at timestamptz,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id,recognition_year)
);
create index if not exists franklin_member_decal_status_idx on franklin_member_decal_fulfillment(status,recognition_year,updated_at desc);
