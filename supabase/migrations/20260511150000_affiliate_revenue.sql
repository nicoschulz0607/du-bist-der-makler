create table affiliate_revenue (
  id          uuid    primary key default gen_random_uuid(),
  partner     text    not null,              -- 'energieausweis', 'notar', 'fotograf', …
  betrag_cent integer not null,
  waehrung    text    not null default 'eur',
  listing_id  uuid    references listings(id) on delete set null,
  user_id     uuid    references auth.users(id) on delete set null,
  erstellt_am date    not null default current_date,
  created_at  timestamptz default now()
);

create index on affiliate_revenue (erstellt_am desc);
create index on affiliate_revenue (partner, erstellt_am desc);
create index on affiliate_revenue (listing_id) where listing_id is not null;
create index on affiliate_revenue (user_id) where user_id is not null;

alter table affiliate_revenue enable row level security;
-- Keine Policies: nur Service Role (helios) liest/schreibt
