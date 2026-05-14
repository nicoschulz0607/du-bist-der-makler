-- HELIOS Sprint 1: Admin-Dashboard Tabellen
-- Anwenden: supabase db push oder im Supabase Dashboard ausführen

-- 1. admin_users — Zugriffsliste für /helios
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  added_at timestamptz default now(),
  added_by text
);

insert into admin_users (email, added_by) values
  ('nico.schulz0607@gmail.com', 'system');
  -- TODO: Add kollege@... once email confirmed

-- Kein RLS nötig — nur via Service Role Key zugänglich

-- 2. business_events — Business-Event-Tracking (parallel zu PostHog)
create table business_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid references auth.users(id) on delete set null,
  listing_id uuid references listings(id) on delete set null,
  properties jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index on business_events (event_name, created_at desc);
create index on business_events (user_id) where user_id is not null;
create index on business_events (listing_id) where listing_id is not null;

-- 3. helios_audit_log — Audit-Spur für schreibende Admin-Aktionen (Sprint 2+)
create table helios_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  action text not null,
  target_type text,
  target_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

create index on helios_audit_log (admin_email, created_at desc);
