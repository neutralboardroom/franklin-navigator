-- FR-NAV1.30.8-HF3.12.0 additive site-wide incident monitoring.
-- Rollback must retain incident/history rows. Never store payment credentials, passwords, auth tokens, cookies, secret keys or raw sensitive request bodies.
create table if not exists franklin_incidents(
  incident_id text primary key,
  community text not null default 'FRANKLIN_TN' check(community='FRANKLIN_TN'),
  fingerprint_sha256 text not null unique check(length(fingerprint_sha256)=64),
  category text not null,
  severity text not null check(severity in ('CRITICAL','HIGH','NORMAL')),
  workflow text not null,
  safe_error_code text not null,
  source text not null,
  correlation_id text,
  profile_id text,
  account_ref_hash text,
  membership_ref_hash text,
  safe_context jsonb not null default '{}'::jsonb,
  status text not null default 'OPEN' check(status in ('OPEN','ACKNOWLEDGED','RESOLVED','SUPPRESSED')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  occurrence_count integer not null default 1 check(occurrence_count>0),
  alert_delivery_state text not null default 'EXTERNAL_CONFIG_REQUIRED' check(alert_delivery_state in ('EXTERNAL_CONFIG_REQUIRED','OWNER_VISIBLE','DELIVERED','FAILED')),
  last_alert_at timestamptz,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists franklin_incidents_open_idx on franklin_incidents(status,severity,last_seen desc);
create index if not exists franklin_incidents_workflow_idx on franklin_incidents(workflow,last_seen desc);
create index if not exists franklin_incidents_profile_idx on franklin_incidents(profile_id,last_seen desc) where profile_id is not null;

create table if not exists franklin_incident_events(
  event_id text primary key,
  incident_id text not null references franklin_incidents(incident_id) on delete cascade,
  community text not null default 'FRANKLIN_TN' check(community='FRANKLIN_TN'),
  correlation_id text,
  safe_context jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists franklin_incident_events_incident_idx on franklin_incident_events(incident_id,occurred_at desc);
