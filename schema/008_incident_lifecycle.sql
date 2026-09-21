-- R1353 additive incident lifecycle + notification hygiene.
-- Preserves all existing incidents/events; adds lifecycle and delivery metadata only.
alter table franklin_incidents
  add column if not exists environment text not null default 'PRODUCTION',
  add column if not exists affected_path text,
  add column if not exists http_method text,
  add column if not exists failure_cause text,
  add column if not exists component text,
  add column if not exists release_identity text,
  add column if not exists last_alert_severity text,
  add column if not exists last_notification_kind text,
  add column if not exists resolved_alert_at timestamptz,
  add column if not exists reopened_at timestamptz,
  add column if not exists last_digest_at timestamptz,
  add column if not exists last_state_change_at timestamptz not null default now();

create index if not exists franklin_incidents_fingerprint_lifecycle_idx
  on franklin_incidents(status,severity,affected_path,http_method,last_seen desc);
create index if not exists franklin_incidents_digest_idx
  on franklin_incidents(status,severity,last_digest_at,last_seen desc);
