-- Financial Courses: one row per signed-in learner holding their progress (the same JSON the app
-- keeps in localStorage). Each learner can only see and change their own row.
create table if not exists public.fc_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now(),
  constraint fc_progress_state_size check (pg_column_size(state) < 2000000)
);

alter table public.fc_progress enable row level security;

drop policy if exists "fc: read own progress" on public.fc_progress;
create policy "fc: read own progress" on public.fc_progress
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "fc: insert own progress" on public.fc_progress;
create policy "fc: insert own progress" on public.fc_progress
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "fc: update own progress" on public.fc_progress;
create policy "fc: update own progress" on public.fc_progress
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "fc: delete own progress" on public.fc_progress;
create policy "fc: delete own progress" on public.fc_progress
  for delete to authenticated using (user_id = (select auth.uid()));
