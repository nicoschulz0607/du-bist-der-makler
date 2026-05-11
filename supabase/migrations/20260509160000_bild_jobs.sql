create table bild_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  listing_id uuid references listings(id),
  job_type text check (job_type in ('enhance', 'staging', 'outdoor')) not null,
  status text check (status in ('pending', 'processing', 'done', 'failed')) not null default 'pending',
  input_url text not null,
  output_urls text[],
  metadata jsonb,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

alter table bild_jobs enable row level security;
create policy "Users see own bild_jobs" on bild_jobs for all using (auth.uid() = user_id);

create index idx_bild_jobs_user_id on bild_jobs (user_id);
create index idx_bild_jobs_user_type_status on bild_jobs (user_id, job_type, status);
