# AI Context - SplitEase

## Product Understanding
SplitEase is a simplified MVP clone of Splitwise, designed to be built and deployed in a single day. The core focus is on group-based expense sharing and tracking simple balances between group members.

## Product Scope
* **In Scope**:
  * User authentication (Email/Password) via Supabase Auth.
  * Creating groups.
  * Adding registered users to groups (using a dropdown of all profiles for demo/assignment purposes).
  * Adding expenses (equal split among selected members of the group).
  * Dynamically calculating and viewing group balances.
  * Recording settlements (payments between members to reduce balance).
* **Out of Scope**:
  * Multi-currency (defaulting to a single default currency, e.g., USD / $).
  * Receipt scanning.
  * Notifications (push/email).
  * Activity feeds and real-time sync.
  * Friend requests (users are added directly to groups).
  * Expense editing/deletion (once created, expenses are static for MVP simplicity).
  * Debt simplification (minimizing transactions via graph algorithms).
  * Offline mode.

## User Personas
* **Group Creator**: Creates a group and adds existing registered profiles to it.
* **Group Member**: Accesses group details, adds group expenses, views outstanding balances, and records settlements.

## User Stories
1. **User Sign Up & Login**: As a user, I want to create an account and log in securely so that my groups and expenses are private to me and my friends.
2. **Create Group**: As a logged-in user, I want to create a group (e.g., "Apartment 2B") so I can track shared expenses with specific roommates.
3. **Add Group Members**: As a group creator, I want to add other registered users to my group from a dropdown list so we can share expenses.
4. **Add Expense**: As a group member, I want to record an expense (e.g., "Groceries - $60"), select who paid, and select which members are splitting it, so the app calculates splits equally.
5. **View Balances**: As a group member, I want to see a summary of who owes whom and how much, calculated dynamically, so I know my current financial standing.
6. **Record Settlement**: As a group member, I want to record a payment (e.g., "A settled with B - $20") to clear or reduce balances.

## Implementation Decisions & Engineering Requirements
* **Tech Stack**: Next.js (App Router), Supabase (Auth, Database, Client Library), TailwindCSS.
* **Deployment**: Vercel (Frontend & Serverless API Routes), Supabase (Hosted Postgres Database & Authentication).
* **Testing**: Manual verification of user flows (auth, group creation, expense addition, dynamic balance calculation, settlement).
* **Security & Auth**:
  * Route protection using Next.js Proxy/Middleware.
  * Auth-guarded routes: `/dashboard`, `/groups/*`.
  * Public routes: `/login`, `/signup`, `/` (landing/redirect).
  * Any group member can add expenses/settlements within their group. No admin roles.
* **Math & Rounding**:
  * Monetary values stored as numeric with 2 decimal precision.
  * Equal division rounds to 2 decimals. The remainder (usually 1-2 cents) is absorbed by the payer.
* **Dynamic Balances**:
  * Balances are **NOT** stored in the database to prevent derived data inconsistencies.
  * All balances are calculated on-the-fly on the client or API routes by combining the sum of `expense_splits` and `settlements` for the group.

## UI Design Guidelines
* **Aesthetics**: Clean, minimal, modern, and highly usable dashboard.
* **Responsiveness**: Fully responsive mobile-first design using Tailwind CSS utility classes.
* **Libraries**: Tailwind CSS only. Avoid heavy UI libraries (like Bootstrap, Material UI) to keep build and load times ultra-fast.
* **Visuals**: Focus on typography, clear green/red color coding for balances ("owes you" vs "you owe"), and intuitive navigation.

## Database Schema (Supabase Postgres)

### `profiles` (Synced with Supabase Auth users via trigger)
* `id` (uuid, primary key, references auth.users.id ON DELETE CASCADE)
* `email` (text, unique)
* `name` (text)
* `created_at` (timestamp with time zone)

### `groups`
* `id` (uuid, primary key, default gen_random_uuid())
* `name` (text, not null)
* `created_by` (uuid, references profiles.id)
* `created_at` (timestamp with time zone)

### `group_members`
* `group_id` (uuid, references groups.id ON DELETE CASCADE)
* `user_id` (uuid, references profiles.id ON DELETE CASCADE)
* `joined_at` (timestamp with time zone, default now())
* *Primary Key: (group_id, user_id)*

### `expenses`
* `id` (uuid, primary key, default gen_random_uuid())
* `group_id` (uuid, references groups.id ON DELETE CASCADE)
* `paid_by` (uuid, references profiles.id)
* `amount` (numeric(10,2), not null)
* `description` (text, not null)
* `created_at` (timestamp with time zone, default now())

### `expense_splits`
* `id` (uuid, primary key, default gen_random_uuid())
* `expense_id` (uuid, references expenses.id ON DELETE CASCADE)
* `user_id` (uuid, references profiles.id ON DELETE CASCADE)
* `amount_owed` (numeric(10,2), not null)

### `settlements`
* `id` (uuid, primary key, default gen_random_uuid())
* `group_id` (uuid, references groups.id ON DELETE CASCADE)
* `paid_by` (uuid, references profiles.id) -> Person who paid money
* `paid_to` (uuid, references profiles.id) -> Person who received money
* `amount` (numeric(10,2), not null)
* `created_at` (timestamp with time zone, default now())

---

## API Design (Supabase Client Direct & Next.js Server Actions)
* Auth: Using `@supabase/ssr` or `@supabase/supabase-js` auth handlers.
* Fetching Groups: Query `group_members` joined with `groups` for current user.
* Fetching Group Details: Fetch members, expenses, splits, and settlements in parallel.
* Calculating Balances: Done dynamically inside `src/lib/calculations/balances.ts` after fetching data.

## Frontend Structure
Refer to `BUILD_PLAN.md` for the directory layout. Key views are:
1. Auth Page: Shared component/layout for `/login` and `/signup`.
2. Dashboard Page: Lists user's groups, overall net balance (You owe/You are owed), and a "Create Group" button.
3. Group Page: Lists group expenses, displays member balances, and has quick action buttons for "Add Expense" and "Settle Up".

## Deployment Plan
1. **Frontend**: Deployed on Vercel, hooked up to the GitHub repository for automatic CD.
2. **Backend**: Supabase project configured with environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) injected into Vercel.
3. **Database Rules**: Row Level Security (RLS) configured on Supabase to ensure users can only read/write data in groups they belong to.

## Testing Plan (Manual)
1. **Signup/Login Flow**: Create two accounts (User A, User B). Verify logins.
2. **Group Creation**: User A creates "Apartment 1". Verify dashboard updates.
3. **Add Member**: User A adds User B to "Apartment 1". Verify B's dashboard shows the group.
4. **Add Expense (Everyone split)**: User A pays $30 for dinner, split equally between A and B ($15 each). Verify B owes A $15.
5. **Add Expense (Payer only splits)**: User B pays $20 for groceries, split between B and C (not A). Verify A's balance remains unchanged.
6. **Settlement**: B pays A $15. Verify balance drops to $0.

## Tradeoffs
* **No Database Sync/Realtime**: Reduced complexity and database load by fetching static data on route transition instead of WebSockets.
* **No Debt Simplification**: Keeps calculations O(N^2) instead of writing complex flow network algorithms, saving time and keeping logic transparent.
* **Profiles Sync Trigger**: Instead of writing separate sync code in Next.js, we use a Postgres trigger in Supabase to sync `auth.users` with `public.profiles`.

## Change Log & Evolving Decisions
* **Initial Proposal**: Suggestion of `users` table and mock authentication.
* **Refinement 1**: Renamed `users` to `profiles` to prevent naming collision with Supabase's internal schema.
* **Refinement 2**: Confirmed that balances are computed dynamically from transaction tables rather than stored as running balances to avoid derived data anomalies.
* **Refinement 3**: Structured `/lib` into specific domains (supabase, calculations, validations, helpers) for cleaner evaluation.
* **Refinement 4 (Next.js 16 Migration)**: Renamed root `middleware.ts` to `proxy.ts` and updated the default handler signature to `export async function proxy` due to Next.js 16's deprecation warnings.

## AI Collaboration Log & Prompts
* **Prompt 1 (Scoping)**: Acted as junior engineer to interview user on Product Goals, authentication, group splits, dynamic calculations, and stack.
* **Prompt 2 (Setup & Schema)**: Proposed the relational schema utilizing `profiles`, transaction ledgers, and dynamic query routines rather than stored columns.
* **Prompt 3 (Refinement & Route Protection)**: Confirmed middleware config, `/lib` directory structures, and renaming public tables to `profiles`.
* **Prompt 4 (Framework Compliance)**: Migrated `middleware.ts` to `proxy.ts` when Next.js 16 build logs outputted deprecation notices.

## Risks & Mitigations
* **Supabase Client Inactivity**: Cold starts or rate limits. *Mitigation*: Simple loading states and UI spinners.
* **Concurrent database edits**: E.g. adding two settlements simultaneously. *Mitigation*: Dynamic calculations run from raw transaction tables, meaning database state remains consistent (no race conditions on balance columns).

## Reproducibility Notes
To recreate this app:
1. Run standard Next.js initialization.
2. Configure a Supabase DB with the schema in `BUILD_PLAN.md`.
3. Set up the SQL trigger for profile creation on Supabase:
   ```sql
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

   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute procedure public.handle_new_user();
   ```
4. Copy `/src` folder contents.
5. Deploy to Vercel with credentials.

## Known Limitations
* **Global Profiles Dropdown**: For demo convenience, the app queries the complete profiles directory when adding group members. In production, this would be locked down via a search-by-email query to maintain privacy.
* **No Cache Realtime Sync**: UI relies on Next.js `revalidatePath` and route refreshes. Real-time updates (e.g. pusher.com or Supabase realtime) are omitted to minimize MVP dependencies.
* **Absorbed Rounding**: Cent remainders (e.g., splitting $10.00 between 3 members results in $3.33 each, leaving $0.01) are absorbed directly by the payer splits. While robust, this means splits are mathematically equalized under rounded terms.
