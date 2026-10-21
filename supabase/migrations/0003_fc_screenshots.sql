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
