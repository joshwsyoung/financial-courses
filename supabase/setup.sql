-- Financial Courses: one-off setup for the shared Supabase project. Safe to run more than once.
-- Paste into Supabase dashboard > SQL Editor > New query, then Run. Generated from supabase/migrations/.
begin;

-- ===== supabase/migrations/0001_fc_feedback.sql
-- Financial Courses: feedback from the in-app "Feedback" button.
-- Tables are prefixed fc_ because this Supabase project is shared with other apps.
-- Anyone can insert; nobody can read through the public API (maintainers use the dashboard).
create table if not exists public.fc_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('wrong', 'unclear', 'typo', 'difficulty', 'idea', 'other')),
  message text not null check (char_length(message) between 1 and 4000),
  page text not null check (char_length(page) <= 500),
  task_id text check (char_length(task_id) <= 200),
  question_id text check (char_length(question_id) <= 200),
  answer text check (char_length(answer) <= 2000),
  syllabus_version text check (char_length(syllabus_version) <= 50),
  app_commit text check (char_length(app_commit) <= 64),
  screenshot_path text check (screenshot_path is null or screenshot_path ~ '^feedback/[0-9a-f-]{36}\.(jpg|png|webp)$'),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'triaged', 'fixed', 'wontfix'))
);

alter table public.fc_feedback enable row level security;

drop policy if exists "fc: anyone can send feedback" on public.fc_feedback;
create policy "fc: anyone can send feedback"
  on public.fc_feedback for insert
  to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = (select auth.uid())));

create index if not exists fc_feedback_created_at_idx on public.fc_feedback (created_at desc);
create index if not exists fc_feedback_user_id_idx on public.fc_feedback (user_id);

-- ===== supabase/migrations/0002_fc_progress.sql
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

-- ===== supabase/migrations/0003_fc_screenshots.sql
-- Financial Courses: private storage for feedback screenshots.
-- Anyone may upload into feedback/ (images only, max 2 MB); nobody can list or read via the API.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fc-feedback-screenshots', 'fc-feedback-screenshots', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fc: anyone can upload feedback screenshots" on storage.objects;
create policy "fc: anyone can upload feedback screenshots" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'fc-feedback-screenshots' and (storage.foldername(name))[1] = 'feedback');

commit;

-- Check: should list fc_feedback and fc_progress (rls = true) and the screenshot bucket.
select relname, relrowsecurity as rls from pg_class where relname in ('fc_feedback', 'fc_progress');
