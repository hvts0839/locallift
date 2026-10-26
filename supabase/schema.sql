-- LocalLift AI — Supabase schema (TECHNICAL-ARCHITECTURE.md §4)
-- Run in the Supabase SQL editor. Runtime wiring waits for auth (see AGENTS.md cut-order).

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category text not null,
  location text not null,
  description text,
  target_audience text not null,
  brand_tone text not null,
  logo_url text,
  primary_color text,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  objective text not null,
  offer text not null,
  budget integer not null,
  start_date date,
  end_date date,
  status text not null default 'draft',
  strategy text,
  budget_allocation jsonb,
  poster jsonb,
  success_metrics jsonb,
  created_at timestamptz not null default now()
);

create table if not exists campaign_assets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  asset_type text not null, -- social_post | message | headline
  platform text,
  content text not null,
  headline text,
  call_to_action text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists generation_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns(id) on delete set null,
  prompt_version text not null,
  model text not null,
  source text not null default 'ai',
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table campaigns enable row level security;
alter table campaign_assets enable row level security;
alter table generation_logs enable row level security;

create policy "own profiles" on profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own campaigns" on campaigns
  for all using (
    exists (select 1 from profiles where profiles.id = campaigns.profile_id and profiles.user_id = auth.uid())
  ) with check (
    exists (select 1 from profiles where profiles.id = campaigns.profile_id and profiles.user_id = auth.uid())
  );

create policy "own campaign assets" on campaign_assets
  for all using (
    exists (
      select 1 from campaigns
      join profiles on profiles.id = campaigns.profile_id
      where campaigns.id = campaign_assets.campaign_id and profiles.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from campaigns
      join profiles on profiles.id = campaigns.profile_id
      where campaigns.id = campaign_assets.campaign_id and profiles.user_id = auth.uid()
    )
  );

create policy "own generation logs" on generation_logs
  for all using (
    exists (
      select 1 from campaigns
      join profiles on profiles.id = campaigns.profile_id
      where campaigns.id = generation_logs.campaign_id and profiles.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from campaigns
      join profiles on profiles.id = campaigns.profile_id
      where campaigns.id = generation_logs.campaign_id and profiles.user_id = auth.uid()
    )
  );
