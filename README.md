# SplitEase

SplitEase is a full-stack, mobile-responsive MVP clone of Splitwise, built to simplify group expense tracking, dynamic debt calculation, and settlement processing. By aggregating expenses and payments dynamically, SplitEase guarantees zero derived data anomalies while keeping the user experience seamless, fast, and modern.

* **Live Demo**: [https://split-ease-lac.vercel.app](https://split-ease-lac.vercel.app)
* **GitHub Repository**: [https://github.com/piyushxbhardwaj/SplitEase](https://github.com/piyushxbhardwaj/SplitEase)

---

## Project Description

Managing shared costs with roommates, travel companions, or friends is often complicated by rounding errors, uneven splits, and confusing transaction histories. SplitEase solves this by providing a lightweight, elegant solution. Users can create custom groups, add members, input expenses with custom splitting checklists, and record settlements in one click. 

All financial calculations are performed dynamically on-the-fly, ensuring that the ledger is always perfectly balanced and transparent.

---

## Features

- **🔒 Secure Authentication**: Full email and password sign-up/login powered by Supabase Auth with custom public profile sync.
- **🛡️ Route Protection**: Active Next.js middleware that guards private directories (`/dashboard` and `/groups/*`) and redirects unauthenticated requests.
- **👥 Group Management**: Dynamic creation of groups and the ability to instantly add any registered user to a group via a visual interface.
- **💸 Flexible Splitting**: Support for log expenses split equally among selected group members, with live visual calculation previews.
- **📊 Dynamic Balance Aggregation**: Balances are calculated dynamically by summing payments and splits, eliminating database inconsistency issues.
- **🎯 Intelligent Settlement Suggestions**: Greedy debt-matching logic that calculates who owes whom and suggests the minimum transactions needed to settle.
- **Deadlock-Free Settle Up Flow**: Pre-filled suggested payment details from suggestions, dynamic swapping in 2-member groups, and self-settlement protection.
- **📖 Unified Ledgers**: A clean chronological history feed containing both expense entries and recorded payments/settlements.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (Hosted on Supabase)
- **Authentication**: GoTrue (via Supabase Auth)
- **Styling**: TailwindCSS 4 (Utility-first styling for rich aesthetics, sleek dark modes, and modern layouts)
- **Icons**: Lucide React
- **Verification**: Built and verified using Turbopack compiler.

---

## Architecture / Flow

SplitEase runs on a server-rendered client model utilizing Supabase as a backend service. Data security is enforced at the database layer using Row-Level Security (RLS).

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js Client (App)                     │
│  [Dashboard] ──> [Group Details] ──> [Add Expense / Settle]  │
└──────────────┬───────────────────────────────▲───────────────┘
               │                               │
       Cookies / Session               Auth / Fetch
               │                               │
┌──────────────▼───────────────────────────────┴───────────────┐
│                       Supabase Backend                       │
│    Auth Service ──> Profiles Trigger ──> Postgres DB         │
│    (GoTrue)          (Sync Handler)     (Tables with RLS)    │
└──────────────────────────────────────────────────────────────┘
```

### Dynamic Balance Calculation
To prevent synchronization anomalies, balances are calculated on-the-fly:
$$\text{Net Balance} = (\text{Total Paid} + \text{Settlements Paid}) - (\text{Total Owed} + \text{Settlements Received})$$

1. **Paid**: Total amount paid by the user across all expenses.
2. **Owed**: Sum of all split amounts assigned to the user.
3. **Settlements Paid**: Cash paid by the user to other group members.
4. **Settlements Received**: Cash received by the user from other group members.

---

## Screenshots

*(Placeholders: Add images below once captured from the active application)*

### 1. User Dashboard
![User Dashboard Placeholder](https://via.placeholder.com/800x450/020617/ffffff?text=SplitEase+User+Dashboard+Screenshot)

### 2. Group Hub & Ledger
![Group Ledger Placeholder](https://via.placeholder.com/800x450/020617/ffffff?text=SplitEase+Group+Details+and+Ledger+Screenshot)

### 3. Record Settlement Page
![Record Settlement Placeholder](https://via.placeholder.com/800x450/020617/ffffff?text=SplitEase+Settle+Up+Form+Screenshot)

---

## Setup Instructions

Follow these steps to run SplitEase locally.

### Environment Variables
Before running the project, create a `.env.local` file in the root directory. You can use the provided `.env.local.example` as a starting point:

```bash
cp .env.local.example .env.local
```

Configure the following variables with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Configuration
Create the required database tables and triggers:
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Copy and paste the contents of [schema.sql](schema.sql).
3. Run the script to initialize tables (`profiles`, `groups`, `group_members`, `expenses`, `expense_splits`, `settlements`), trigger actions (profile syncing on signup), and activate RLS policies.

### Running Locally
Once database triggers and environment variables are in place, spin up the development server:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment on Vercel
1. Push your repository to GitHub.
2. Link your repository in the Vercel Dashboard.
3. Configure the environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Set the build command to `npm run build`.
5. Deploy. Automatic deployments are configured for pushes to the `main` branch.

---

## Folder Structure

```text
/public
/src
  /app
    /login
      page.tsx               # Login Form
    /signup
      page.tsx               # Sign Up Form
    /dashboard
      page.tsx               # User Dashboard
      DashboardClient.tsx    # Client-side Dashboard Views
    /groups
      /[id]
        page.tsx             # Group Detail Hub
        /add-expense
          page.tsx           # Add Expense Layout
          AddExpenseForm.tsx # Split Calculation Form
        /settle
          page.tsx           # Settle Up Page
          SettleUpForm.tsx   # Record Settlement Form
    layout.tsx               # Root App Layout
    page.tsx                 # Entry Routing Page
    proxy.ts                 # Route protection proxy
  /components
    /layout
      Navbar.tsx             # Global Navigation Bar
  /lib
    /supabase
      client.ts              # Browser Supabase Connection
      server.ts              # Server-Side Supabase Connection
      queries.ts             # Auth & Group Fetching Routines
    /calculations
      balances.ts            # Dynamic Balance Engine
    /validations
      auth.ts                # Client Authentication Validations
    /helpers
      formatters.ts          # Date and Currency Formatters
schema.sql                   # SQL Database Schema & RLS Setup
```

---

## Key Challenges & Fixes

### 1. Hydration & Mismatches in Settle Page
* **Challenge**: Next.js hydration warnings when accessing `useSearchParams` because query values differ on initial client mount versus server-side render.
* **Fix**: Abstracted state logic inside client components, initializing empty values before safely hydrating search param values via controlled `useEffect` bindings inside a `<Suspense>` wrapper.

### 2. Form Deadlocks in 2-Member Settlements
* **Challenge**: The settlement form previously excluded selected users from opposite dropdown lists to prevent self-settlements. In 2-member groups, this deadlocked selectors and prevented direction modification.
* **Fix**: Removed the exclusion filters from the selects. Built client-side swapping for 2-member groups that updates the other dropdown automatically when one is modified, and integrated safety checks with active disabled states to prevent self-settlement.

### 3. Dynamic RLS Recursion on Members
* **Challenge**: Problematic RLS policies on `group_members` recursively queried `group_members` to verify authorization, leading to PostgreSQL infinite recursion errors.
* **Fix**: Streamlined the insertion and verification logic by referencing `groups` metadata directly to break the recursion chain.

---

## Future Improvements

- **⚡ Graph-Based Debt Simplification**: Implementing a splitwise-style simplification algorithm to minimize transaction count.
- **🏷️ Receipt Uploads & OCR**: Automatic extraction of items and splits from photographed invoices.
- **🔔 Live Alerts & Notifications**: Real-time push or email notifications when a group member records an expense or requests a settlement.
- **💳 Payment Gateway Integration**: Direct Stripe or peer-to-peer UPI integration to settle transactions directly inside the app.

---

## Author

Created and maintained by [Piyush Bhardwaj](https://github.com/piyushxbhardwaj).
