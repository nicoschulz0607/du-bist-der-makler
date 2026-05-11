alter table listings
  add column if not exists immoscout_status text,
  add column if not exists verkauft_am timestamptz;
