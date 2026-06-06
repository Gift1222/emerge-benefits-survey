-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Create the responses table
create table if not exists public.responses (
  id               uuid primary key default gen_random_uuid(),
  submitted_at     timestamptz not null default now(),
  employee         jsonb not null default '{}',
  ratings          jsonb not null default '{}',
  priorities       text[] not null default '{}',
  salary_increment text,
  recommendations  text,
  suggestions      text
);

-- 2. Enable Row Level Security
alter table public.responses enable row level security;

-- 3. Anyone can INSERT (employees submitting the form — no login required)
create policy "Allow public inserts"
  on public.responses for insert
  with check (true);

-- 4. Only authenticated admins can SELECT (read all responses)
create policy "Allow authenticated reads"
  on public.responses for select
  using (auth.role() = 'authenticated');

-- 5. (Optional) Index for faster dashboard queries
create index if not exists responses_submitted_at_idx
  on public.responses (submitted_at desc);
