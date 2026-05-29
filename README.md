# SplitEase

SplitEase is a full-stack, mobile-responsive MVP clone of Splitwise built using Next.js, Supabase (Postgres & Auth), and TailwindCSS. It is designed to track group-based shared expenses, dynamically calculate who owes whom, and manage settlements.

## Key Features

- **Email & Password Authentication**: Secured using Supabase Auth.
- **Route Protection**: Next.js Middleware automatically guards private routes (`/dashboard` and `/groups/*`).
- **Group Management**: Users can create groups and add other registered users instantly.
- **Equal Splitting with Exclusions**: Record expenses and split them equally among selected group members, with live split-calculation previews.
- **Dynamic Balance Calculation**: Balances are calculated on-the-fly directly from expense splits and settlements to guarantee consistency (balances are not stored).
- **One-Click Settlements**: Settle outstanding balances between members directly from suggestion links.
- **Consolidated Ledger**: Activity history shows all expenses and settlements sorted chronologically.

---

## Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase (Postgres & GoTrue Auth)
- **Styling**: TailwindCSS 4 (Utility-first styling, no heavy UI libraries)
- **Icons**: Lucide React

---

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SplitEase
```

### 2. Set Up Environment Variables
Create a file named `.env.local` in the root directory:
```bash
cp .env.local.example .env.local
```
Fill in your Supabase URL and Anon Key from your Supabase Dashboard (Settings -> API):
```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 3. Initialize the Database Schema
Copy the SQL scripts inside [schema.sql](file:///d:/Project/SplitEase/schema.sql) and execute them in your Supabase project's **SQL Editor**. This will:
1. Create `profiles`, `groups`, `group_members`, `expenses`, `expense_splits`, and `settlements` tables.
2. Initialize a Postgres trigger that automatically creates a public profile row when a new user signs up.
3. Enable Row-Level Security (RLS) on all tables with secure access policies.

### 4. Install Dependencies & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Balance Calculation Engine

SplitEase avoids derived data anomalies by computing balances dynamically. Net balance is computed as:
$$\text{Net Balance} = (\text{Total Paid} + \text{Settlements Paid}) - (\text{Total Owed} + \text{Settlements Received})$$

1. **Expenses**: Sum the amounts the user paid.
2. **Splits**: Sum the splits the user is responsible for.
3. **Settlements**: Factor in direct payments recorded.
4. **Debts matching**: The greedy algorithm matches the most negative balances (debtors) against the most positive balances (creditors) to suggest the minimum settlement transactions.

---

## Verification Scenarios (Manual Testing)

1. **Authentication**: Register `user_a@test.com` and `user_b@test.com`. Log in to verify session creation and route guard redirects.
2. **Create Group**: Log in as `user_a@test.com` and create a group named "Apartment 1".
3. **Add Member**: Use the dropdown list to add `user_b@test.com` to the group.
4. **Log Expense**: Add an expense for $60.00 (Dinner) paid by `user_a@test.com`, selecting both members. Check that `user_b` owes `user_a` $30.00.
5. **Settle Up**: Click the suggested settlement link. Record a settlement payment of $30.00 from `user_b` to `user_a`. Confirm balances return to $0.00.
