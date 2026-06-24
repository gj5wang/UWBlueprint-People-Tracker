# UW Blueprint People Tracker — Setup Guide

## Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier is fine)

---

## 1. Install dependencies

```bash
npm install
```

---

## 2. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Once created, go to **Settings → API** and copy:
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon/public key** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`) — keep this secret

---

## 3. Configure environment variables

```bash
cp .env.local.example .env.local
# Then fill in your keys from step 2
```

---

## 4. Run the database schema

1. Open your Supabase project → **SQL Editor**
2. Paste the contents of `supabase/schema.sql` and run it

This creates:
- `teams` table (with 5 placeholder teams)
- `members` table (all fields, all tiers)
- `member_notes` table
- Row-level security policies
- Helper SQL functions for permission checks

---

## 5. Enable Google OAuth

1. Supabase → **Authentication → Providers → Google**
2. Enable it and set up a Google OAuth app at [console.cloud.google.com](https://console.cloud.google.com)
   - Authorized redirect URI: `https://<your-project>.supabase.co/auth/v1/callback`
3. Paste the Client ID and Secret into Supabase

To restrict login to `@uwblueprint.org` accounts:
- In Google Cloud Console → OAuth consent screen → **Authorized domains** → add `uwblueprint.org`
- The app already passes `hd: 'uwblueprint.org'` in the OAuth request

---

## 6. Add the first super admin member

After logging in once with your @uwblueprint.org account, your `auth.users` record is created but you won't have a `members` row yet.

Run this in the Supabase SQL editor (replace values):

```sql
insert into public.members (
  user_id, first_name, last_name, bp_email, roles, status
)
values (
  '<your-auth-user-id>',  -- find in Auth → Users
  'Your First Name',
  'Your Last Name',
  'you@uwblueprint.org',
  array['Co-president'],  -- or 'VP Talent'
  'current'
);
```

After this, you can log in and use the Admin page to add all other members.

---

## 7. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Permission tiers

| Tier | Roles | Access |
|------|-------|--------|
| **Member** | Everyone else | Basic fields (name, email, team, role, program, year, status) |
| **Team Lead** | Project Lead, Product Manager | + Study/co-op, location, terms, notes\*, skill level\* (own team only) |
| **VP** | VP Engineering/Design/Product/etc., Directors | Same as Team Lead but all teams |
| **Super Admin** | Co-president, VP Talent | Everything + personal email, gender, ethnicity, CSV export, admin panel |

\* Notes and skill level are always hidden from the member themselves.

---

## File structure

```
app/
  login/          Login page (Google OAuth)
  sheet/          Main people tracker table
  profile/[id]/   Member profile view/edit
  admin/          Super admin panel (teams, member creation)
  api/members/export/  CSV download endpoint
  auth/callback/  OAuth redirect handler

components/
  Navbar.tsx      Top nav with role-aware links
  MemberSheet.tsx Filterable/sortable member table
  ProfileForm.tsx Profile edit form (field visibility by tier)

lib/
  supabase/       Supabase clients (browser + server)
  permissions.ts  Tier logic, column visibility, access checks

types/index.ts    All types, role constants, permission tiers
supabase/schema.sql  DB schema + RLS (run this in Supabase)
```
