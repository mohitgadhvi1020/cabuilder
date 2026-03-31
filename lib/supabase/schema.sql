-- Run this in the Supabase SQL editor after creating a project.
-- Safe to re-run: uses "if not exists" / "create or replace" throughout.

create extension if not exists "uuid-ossp";

-- Helper: auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles (created on sign-up, 1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  organization text not null default '',
  phone text not null default '',
  role text not null default 'ca',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users manage own profile') then
    create policy "Users manage own profile"
      on public.profiles for all
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new user signs up.
-- Reads full_name, organization, phone from user_metadata passed during signUp().
-- Runs as SECURITY DEFINER so it bypasses RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, organization, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'organization', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Companies (per authenticated user)
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists companies_user_id_idx on public.companies (user_id);

alter table public.companies enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'companies' and policyname = 'Users manage own companies') then
    create policy "Users manage own companies"
      on public.companies for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

-- CMA reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'CMA Report',
  status text not null default 'draft',
  form_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_company_id_idx on public.reports (company_id);
create index if not exists reports_user_id_idx on public.reports (user_id);

alter table public.reports enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'reports' and policyname = 'Users manage own reports') then
    create policy "Users manage own reports"
      on public.reports for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

-- Uploaded images metadata
create table if not exists public.report_images (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  created_at timestamptz not null default now()
);

create index if not exists report_images_report_id_idx on public.report_images (report_id);

alter table public.report_images enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'report_images' and policyname = 'Users manage images for own reports') then
    create policy "Users manage images for own reports"
      on public.report_images for all
      using (
        exists (
          select 1 from public.reports r
          where r.id = report_images.report_id and r.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.reports r
          where r.id = report_images.report_id and r.user_id = auth.uid()
        )
      );
  end if;
end $$;
