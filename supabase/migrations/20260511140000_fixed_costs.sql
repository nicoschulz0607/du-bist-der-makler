create table fixed_costs (
  id          uuid    primary key default gen_random_uuid(),
  name        text    not null unique,
  betrag_cent integer not null,
  waehrung    text    not null default 'eur',
  category    text    not null default 'sonstiges'
              check (category in ('infra', 'portal', 'legal', 'marketing', 'tools', 'sonstiges')),
  gueltig_ab  date    not null,
  gueltig_bis date,                        -- null = läuft noch
  created_at  timestamptz default now()
);

create index on fixed_costs (gueltig_ab, gueltig_bis);
create index on fixed_costs (category);

alter table fixed_costs enable row level security;
-- Keine Policies: nur Service Role (helios) liest/schreibt

-- Seed: monatliche Fixkosten Stand Mai 2026
-- on conflict do nothing → idempotent, beliebig oft ausführbar
insert into fixed_costs (name, betrag_cent, category, gueltig_ab) values
  ('immo_scout_flatrate', 60000, 'portal', '2026-01-01'),   -- 600,00 €
  ('vercel_pro',           2000, 'infra',  '2026-01-01'),   --  20,00 €
  ('supabase_pro',         2500, 'infra',  '2026-01-01'),   --  25,00 €
  ('hetzner_server',        800, 'infra',  '2026-01-01'),   --   8,00 €
  ('resend_pro',           2000, 'tools',  '2026-01-01'),   --  20,00 €
  ('erecht24',             3000, 'legal',  '2026-01-01'),   --  30,00 €
  ('domain',                150, 'infra',  '2026-01-01')    --   1,50 €
on conflict (name) do nothing;
