-- ==========================================
-- 1. EXTENSIONS & ENUMS
-- ==========================================
create extension if not exists "uuid-ossp";

-- Define statuses
create type course_status as enum ('Draft', 'Published', 'Archived');
create type enrollment_status as enum ('Active', 'Completed', 'Dropped');
create type submission_status as enum ('Pending', 'Graded', 'Late');
create type research_status as enum ('Proposal', 'Ongoing', 'Completed');
create type startup_stage as enum ('Idea', 'Prototype', 'MVP', 'Seed', 'Growth');

-- ==========================================
-- 2. AUTH & USER MANAGEMENT (RBAC)
-- ==========================================

-- Public User Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text,
  last_name text,
  avatar_url text,
  role_name text default 'Student',
  department text,
  created_at timestamp with time zone default now()
);

-- Row Level Security for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Handle new user registration automatically
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 3. COURSE MANAGEMENT
-- ==========================================

create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique,
  description text,
  status course_status default 'Draft',
  created_at timestamp with time zone default now()
);

alter table public.courses enable row level security;
create policy "Courses are viewable by enrolled students." 
  on courses for select using (true); -- Simplified for MVP

create table public.modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses on delete cascade,
  title text,
  order_index int
);

create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.modules on delete cascade,
  title text,
  content text,
  video_url text,
  order_index int
);

-- ==========================================
-- 4. COHORTS
-- ==========================================

create table public.cohorts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  start_date timestamp with time zone,
  end_date timestamp with time zone
);

create table public.cohort_members (
  cohort_id uuid references public.cohorts on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  primary key (cohort_id, user_id)
);

-- ==========================================
-- 5. ASSIGNMENTS & SUBMISSIONS
-- ==========================================

create table public.assignments (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses on delete cascade,
  title text,
  due_date timestamp with time zone
);

create table public.submissions (
  id uuid default uuid_generate_v4() primary key,
  assignment_id uuid references public.assignments on delete cascade,
  student_id uuid references public.profiles on delete cascade,
  content text,
  file_urls text[],
  grade numeric,
  feedback text,
  status submission_status default 'Pending',
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 6. PROJECT-BASED LEARNING
-- ==========================================

create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  name text,
  description text,
  cohort_id uuid references public.cohorts on delete set null
);

create table public.project_members (
  project_id uuid references public.projects on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  primary key (project_id, user_id)
);

-- ==========================================
-- 7. RESEARCH & INNOVATION
-- ==========================================

create table public.research_proposals (
  id uuid default uuid_generate_v4() primary key,
  title text,
  status research_status default 'Proposal'
);

create table public.startups (
  id uuid default uuid_generate_v4() primary key,
  name text,
  elevator_pitch text,
  stage startup_stage default 'Idea'
);

-- ==========================================
-- 8. ANALYTICS & SYSTEM
-- ==========================================

create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade,
  title text,
  link text,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- RBAC Helper Function
-- ==========================================

create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role_name = 'Admin'
  );
end;
$$ language plpgsql security definer;
