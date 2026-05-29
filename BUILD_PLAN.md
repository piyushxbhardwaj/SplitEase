# Build Plan - SplitEase

## Phase 1: Project Initialization & Supabase Setup
1. Initialize Next.js project with Tailwind CSS (`npx create-next-app@latest`).
2. Create Supabase project and run DB schema scripts in SQL Editor.
3. Configure environment variables (`.env.local`).
4. Set up public profiles database trigger on Supabase.
5. Create basic UI shell with responsive layout and navigation.

## Phase 2: Authentication & Route Protection
1. Implement Supabase Email/Password Auth.
2. Create Signup page with fields for Email, Password, and Name.
3. Create Login page.
4. Implement Next.js Middleware for Route Protection:
   * **Protected**: `/dashboard`, `/groups/*` (all sub-routes like `/groups/[id]/add-expense` and `/groups/[id]/settle`).
   * **Public**: `/login`, `/signup`, `/` (will redirect to `/dashboard` if logged in, or `/login` if not).

## Phase 3: Groups Management
1. **Dashboard (`/dashboard`)**:
   * Display a clean, minimal dashboard.
   * List groups the current user is a member of.
   * Display a summary of overall balance (total you owe, total you are owed).
2. **Create Group**: Simple form modal or page to create a new group.
3. **Group Details (`/groups/[id]`)**:
   * View group name and list of members.
   * View dynamic balances summary.
   * View Group Expense and Settlement History.
4. **Add Member**: A simple dropdown in the group details page to add any existing registered profile from the database to this group.

## Phase 4: Expenses & Splits
1. **Add Expense Form (`/groups/[id]/add-expense`)**:
   * Fields: Description, Amount, Paid By (select dropdown default to current user), Split checklist (pre-selects all group members).
2. **Splitting Logic**:
   * Divide the total amount equally among selected group members.
   * Round to 2 decimal places. The remaining cents (if any) stay with the paying user.
   * Insert records into `expenses` and corresponding `expense_splits` tables.
3. **Expense History**: Show expense description, who paid, amount, and details of who owed what.

## Phase 5: Balances & Settlements
1. **Dynamic Balances engine**:
   * **Note: Balances are NOT stored in the database.**
   * For a given group, fetch all `expenses`, `expense_splits`, and `settlements`.
   * For each member, calculate net balance by summing how much they paid (from expenses) vs how much they owed (from splits) and factoring in any settlements they paid or received.
   * Output who owes who and display it dynamically on `/groups/[id]`.
2. **Settle Up Form (`/groups/[id]/settle`)**:
   * Record a manual payment/settlement from Member A to Member B.
   * Fields: Payer, Recipient, Amount.
   * Inserts a record into the `settlements` table.
   * Wipes or reduces the dynamic outstanding balance.

---

## Database Schema

```sql
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
  created_by uuid references public.profiles(id),
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
  paid_by uuid references public.profiles(id),
  amount numeric(10,2) not null check (amount > 0),
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. expense_splits table
create table public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references public.expenses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  amount_owed numeric(10,2) not null check (amount_owed >= 0)
);

-- 6. settlements table
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade,
  paid_by uuid references public.profiles(id), -- Person who paid money
  paid_to uuid references public.profiles(id), -- Person who received money
  amount numeric(10,2) not null check (amount > 0),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

---

## Proposed Folder Structure
```text
/src
  /app
    /login
      page.tsx
    /signup
      page.tsx
    /dashboard
      page.tsx
    /groups
      /[id]
        page.tsx             # Group details (balances, expenses, settlements history)
        /add-expense
          page.tsx
        /settle
          page.tsx
    layout.tsx
    page.tsx                 # Redirect root to /dashboard or /login
    middleware.tsx           # Route protection using Supabase Auth
  /components
    /ui                      # Tailwind UI elements (button, input, modal)
    /forms                   # Forms (AddExpenseForm, SettleUpForm, CreateGroupForm)
    /layout                  # Navigation & Global Page Shell
  /lib
    /supabase
      client.ts              # Browser client setup
      server.ts              # Server action/page client setup
      middleware.ts          # Middleware supabase auth update helper
    /calculations
      balances.ts            # Balance engine (aggregates splits and settlements)
    /validations
      auth.ts                # Validation rules for forms
    /helpers
      formatters.ts          # Currency, date formatting helpers
```
