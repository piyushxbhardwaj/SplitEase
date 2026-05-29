-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. profiles table (synced with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. groups table
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. group_members table (join table)
create table public.group_members (
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (group_id, user_id)
);

-- 4. expenses table
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  paid_by uuid references public.profiles(id) on delete set null,
  amount numeric(10,2) not null check (amount > 0),
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. expense_splits table
create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references public.expenses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  amount_owed numeric(10,2) not null check (amount_owed >= 0),
  unique (expense_id, user_id)
);

-- 6. settlements table
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  paid_by uuid references public.profiles(id) on delete set null, -- Person who paid money
  paid_to uuid references public.profiles(id) on delete set null, -- Person who received money
  amount numeric(10,2) not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Trigger to sync auth.users with public.profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable Row Level Security (RLS) (Optional, but best practice for security validation)
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;

-- Create policies

-- Profiles Policies
create policy "Allow public read-only access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Groups Policies
create policy "Users can view groups they are members of" on public.groups
  for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id and group_members.user_id = auth.uid()
    )
  );

create policy "Authenticated users can create groups" on public.groups
  for insert with check (auth.uid() = created_by);

-- Group Members Policies
create policy "Allow authenticated users to view group members" on public.group_members
  for select using (auth.uid() is not null);

create policy "Allow group creators and members to add members" on public.group_members
  for insert with check (
    exists (
      select 1 from public.groups
      where groups.id = group_members.group_id and groups.created_by = auth.uid()
    )
    or exists (
      select 1 from public.group_members as gm
      where gm.group_id = group_members.group_id and gm.user_id = auth.uid()
    )
  );

-- Expenses Policies
create policy "Members can view expenses in their groups" on public.expenses
  for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = expenses.group_id and group_members.user_id = auth.uid()
    )
  );

create policy "Members can insert expenses in their groups" on public.expenses
  for insert with check (
    exists (
      select 1 from public.group_members
      where group_members.group_id = expenses.group_id and group_members.user_id = auth.uid()
    )
  );

-- Splits Policies
create policy "Members can view splits for expenses in their groups" on public.expense_splits
  for select using (
    exists (
      select 1 from public.expenses
      join public.group_members on group_members.group_id = expenses.group_id
      where expenses.id = expense_splits.expense_id and group_members.user_id = auth.uid()
    )
  );

create policy "Members can insert splits for expenses in their groups" on public.expense_splits
  for insert with check (
    exists (
      select 1 from public.expenses
      join public.group_members on group_members.group_id = expenses.group_id
      where expenses.id = expense_splits.expense_id and group_members.user_id = auth.uid()
    )
  );

-- Settlements Policies
create policy "Members can view settlements in their groups" on public.settlements
  for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = settlements.group_id and group_members.user_id = auth.uid()
    )
  );

create policy "Members can insert settlements in their groups" on public.settlements
  for insert with check (
    exists (
      select 1 from public.group_members
      where group_members.group_id = settlements.group_id and group_members.user_id = auth.uid()
    )
  );
