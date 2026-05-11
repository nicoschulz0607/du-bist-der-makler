create index if not exists ai_usage_log_listing_id_idx
  on ai_usage_log (listing_id)
  where listing_id is not null;
