-- AI usage tracking table
-- Tracks every LLM/image-AI call with token counts and cost in USD.
-- Used by lib/ai/track.ts (fire-and-forget inserts) and HELIOS Kosten-View (Sprint 3b).
create table ai_usage_log (
  id            uuid primary key default gen_random_uuid(),
  provider      text not null,           -- 'anthropic' | 'fal' | 'replicate'
  model         text not null,
  call_site     text not null,           -- e.g. 'klara/chat', 'expose', 'staging'
  input_tokens  integer,                 -- null for image providers
  output_tokens integer,                 -- null for image providers
  cost_usd      numeric(10, 6),          -- null if pricing unknown for model
  user_id       uuid references auth.users(id) on delete set null,
  listing_id    uuid references listings(id) on delete set null,
  created_at    timestamptz default now()
);

create index on ai_usage_log (created_at desc);
create index on ai_usage_log (provider, model, created_at desc);
create index on ai_usage_log (call_site, created_at desc);
create index on ai_usage_log (user_id) where user_id is not null;
create index on ai_usage_log (listing_id) where listing_id is not null;

alter table ai_usage_log enable row level security;
-- No policies: only service role (track.ts) can write, no client access
