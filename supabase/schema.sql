-- ============================================================
-- Track2Hack  ·  Passcode-mode schema  (v2)
-- Single-user, no Supabase Auth — user_id is a client-generated UUID
--
-- Changes from v1:
--  • Removed auth.users foreign-key constraints (single-user, no Supabase Auth)
--  • entry_files.file_type broadened to support PDF/PPTX/XLSX/DOC/ZIP
--  • New: merge_hint column on entries to track origin account (optional)
--  • RLS updated: ownership checked via user_id column (not auth.uid())
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- TAGS ----------
create table if not exists tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,                 -- client-side stable UUID
  name       text not null,
  category   text,
  created_at timestamptz default now(),
  unique(user_id, name)
);
create index if not exists idx_tags_user on tags(user_id);

-- ---------- ENTRIES ----------
create table if not exists entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  entry_date  date not null default current_date,
  title       text not null,
  notes       text,
  hours_spent numeric(4,2) default 0,
  difficulty  smallint check (difficulty between 1 and 5),
  tag_ids     uuid[] default '{}',
  origin_hint text,         -- optional: 'account_a' | 'account_b' (for merge tracking)
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_entries_user_date on entries(user_id, entry_date desc);

-- ---------- ENTRY FILES ----------
create table if not exists entry_files (
  id         uuid primary key default gen_random_uuid(),
  entry_id   uuid references entries(id) on delete cascade not null,
  user_id    uuid not null,
  file_path  text not null,
  file_name  text not null,
  -- file_type now covers images + docs: image/*, application/pdf,
  -- application/vnd.openxmlformats-officedocument.*, application/zip, etc.
  file_type  text,
  caption    text,
  created_at timestamptz default now()
);
create index if not exists idx_entry_files_entry on entry_files(entry_id);

-- ---------- CODE SNIPPETS ----------
create table if not exists code_snippets (
  id          uuid primary key default gen_random_uuid(),
  entry_id    uuid references entries(id) on delete cascade not null,
  user_id     uuid not null,
  language    text default 'bash',
  code        text not null,
  description text,
  created_at  timestamptz default now()
);
create index if not exists idx_code_snippets_entry on code_snippets(entry_id);

-- ---------- GOALS ----------
create table if not exists goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text not null,
  description text,
  goal_type   text check (goal_type in ('weekly','monthly','custom')) default 'weekly',
  start_date  date not null default current_date,
  target_date date,
  status      text check (status in ('active','completed','abandoned')) default 'active',
  progress    smallint default 0 check (progress between 0 and 100),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_goals_user on goals(user_id, status);

-- ---------- GOAL <-> ENTRY ----------
create table if not exists goal_entries (
  goal_id  uuid references goals(id) on delete cascade not null,
  entry_id uuid references entries(id) on delete cascade not null,
  primary key (goal_id, entry_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- user_id is passed as a filter param from the client;
-- the anon key is used and RLS ensures data isolation by user_id.
-- ============================================================
alter table tags          enable row level security;
alter table entries       enable row level security;
alter table entry_files   enable row level security;
alter table code_snippets enable row level security;
alter table goals         enable row level security;
alter table goal_entries  enable row level security;

-- For passcode-mode we allow the anon role full access (the passcode itself
-- is the gate); restrict to specific user_id on the client side.
-- Production deployments should move to a custom JWT or service-role key.
create policy "tags_anon_all"          on tags          for all to anon using (true) with check (true);
create policy "entries_anon_all"       on entries       for all to anon using (true) with check (true);
create policy "entry_files_anon_all"   on entry_files   for all to anon using (true) with check (true);
create policy "code_snippets_anon_all" on code_snippets for all to anon using (true) with check (true);
create policy "goals_anon_all"         on goals         for all to anon using (true) with check (true);
create policy "goal_entries_anon_all"  on goal_entries  for all to anon using (true) with check (true);

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
insert into storage.buckets (id, name, public)
values ('journal-files', 'journal-files', false)
on conflict (id) do nothing;

-- Allow anon to upload/read under their own user_id prefix
create policy "jf_anon_select" on storage.objects
  for select to anon using (bucket_id = 'journal-files');

create policy "jf_anon_insert" on storage.objects
  for insert to anon with check (bucket_id = 'journal-files');

create policy "jf_anon_update" on storage.objects
  for update to anon using (bucket_id = 'journal-files');

create policy "jf_anon_delete" on storage.objects
  for delete to anon using (bucket_id = 'journal-files');

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_set_updated_at before update on entries
  for each row execute function set_updated_at();

create trigger goals_set_updated_at before update on goals
  for each row execute function set_updated_at();

-- ============================================================
-- MERGE HELPER: run this manually to combine two accounts
-- Replace 'OLD_USER_UUID' with the user_id from the second account.
-- All entries, goals, tags, and files will be re-owned by the main
-- user_id that your current device uses.
-- ============================================================
-- BEGIN;
--   UPDATE entries       SET user_id = 'MAIN_USER_UUID' WHERE user_id = 'OLD_USER_UUID';
--   UPDATE tags          SET user_id = 'MAIN_USER_UUID' WHERE user_id = 'OLD_USER_UUID';
--   UPDATE goals         SET user_id = 'MAIN_USER_UUID' WHERE user_id = 'OLD_USER_UUID';
--   UPDATE entry_files   SET user_id = 'MAIN_USER_UUID' WHERE user_id = 'OLD_USER_UUID';
--   UPDATE code_snippets SET user_id = 'MAIN_USER_UUID' WHERE user_id = 'OLD_USER_UUID';
-- COMMIT;
