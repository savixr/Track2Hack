-- ============================================================
-- Track2Hack - Cyber Security Learning Journal - Database Schema
-- Run this in Supabase SQL Editor (Project > SQL Editor > New Query)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ---------- TAGS ----------
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text, -- e.g. networking, web, malware, ctf, oscp-prep
  created_at timestamptz default now(),
  unique(user_id, name)
);

-- ---------- ENTRIES (daily journal entries) ----------
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  entry_date date not null default current_date,
  title text not null,
  notes text, -- markdown content
  hours_spent numeric(4,2) default 0,
  difficulty smallint check (difficulty between 1 and 5), -- 1=easy, 5=hard
  tag_ids uuid[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_entries_user_date on entries(user_id, entry_date desc);

-- ---------- ENTRY FILES (screenshots, attachments) ----------
create table if not exists entry_files (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  file_path text not null,   -- path inside storage bucket
  file_name text not null,
  file_type text,            -- image/png, image/jpeg, etc.
  caption text,
  created_at timestamptz default now()
);

create index if not exists idx_entry_files_entry on entry_files(entry_id);

-- ---------- CODE SNIPPETS ----------
create table if not exists code_snippets (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid references entries(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  language text default 'bash',
  code text not null,
  description text,
  created_at timestamptz default now()
);

create index if not exists idx_code_snippets_entry on code_snippets(entry_id);

-- ---------- GOALS ----------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  goal_type text check (goal_type in ('weekly','monthly','custom')) default 'weekly',
  start_date date not null default current_date,
  target_date date,
  status text check (status in ('active','completed','abandoned')) default 'active',
  progress smallint default 0 check (progress between 0 and 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_goals_user on goals(user_id, status);

-- ---------- GOAL <-> ENTRY LINK ----------
create table if not exists goal_entries (
  goal_id uuid references goals(id) on delete cascade not null,
  entry_id uuid references entries(id) on delete cascade not null,
  primary key (goal_id, entry_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (owner-only access — no public sharing)
-- ============================================================
alter table tags enable row level security;
alter table entries enable row level security;
alter table entry_files enable row level security;
alter table code_snippets enable row level security;
alter table goals enable row level security;
alter table goal_entries enable row level security;

create policy "tags_owner_all" on tags
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entries_owner_all" on entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "entry_files_owner_all" on entry_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "code_snippets_owner_all" on code_snippets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_owner_all" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goal_entries_owner_all" on goal_entries
  for all using (
    exists (select 1 from goals g where g.id = goal_entries.goal_id and g.user_id = auth.uid())
  ) with check (
    exists (select 1 from goals g where g.id = goal_entries.goal_id and g.user_id = auth.uid())
  );

-- ============================================================
-- STORAGE BUCKET for screenshots/files (private, owner-only)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('journal-files', 'journal-files', false)
on conflict (id) do nothing;

create policy "journal_files_owner_select" on storage.objects
  for select using (bucket_id = 'journal-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "journal_files_owner_insert" on storage.objects
  for insert with check (bucket_id = 'journal-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "journal_files_owner_update" on storage.objects
  for update using (bucket_id = 'journal-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "journal_files_owner_delete" on storage.objects
  for delete using (bucket_id = 'journal-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- TRIGGER: auto-update updated_at
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
