-- Feedback sent from the in-app "Feedback" button.
-- Anyone can insert; nobody can read through the public API (maintainers use the dashboard).
create table if not exists public.feedback (
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
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  status text not null default 'new' check (status in ('new', 'triaged', 'fixed', 'wontfix'))
);

alter table public.feedback enable row level security;

create policy "anyone can send feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (status = 'new' and (user_id is null or user_id = auth.uid()));

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);
