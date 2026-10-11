# Investing Companion

A private, mobile-first web app that explains the companies and markets I
follow in plain English. See [SPEC.md](SPEC.md) for the full product spec.

**Status:** Phase 1, step 1: login, database, installable on a phone.

## How it's built

| Part | What it does |
| --- | --- |
| Next.js (`src/app`) | The app itself: pages, server code, the install manifest. |
| Supabase | The Postgres database and the login (email sign-in codes). |
| Vercel | Hosts the app on the web and redeploys on every push. |

Privacy works in three layers:

1. **No new accounts.** Sign-ups are switched off in Supabase; the single
   account is created once by hand.
2. **One allowed email.** `ALLOWED_EMAIL` is checked before a code is sent, on
   every page request (`src/proxy.ts`) and before every data read
   (`src/lib/auth.ts`).
3. **Row level security.** Every table only returns rows owned by the signed-in
   user, so even a valid login for someone else sees nothing.

Sign-in uses a **code typed into the app** rather than a tap-the-link email.
On iPhone, a home-screen app keeps its own storage, separate from Safari, so a
link opened from Mail would sign in Safari instead of the app. The email also
includes a link, for when you're on a computer.

## First-time setup

### 1. Supabase (free plan)

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste and run `supabase/migrations/0001_init.sql`.
3. **Authentication → Users → Add user → Create new user**: your email, any
   long random password (never used), and tick *Auto Confirm User*.
4. **Authentication → Sign In / Providers**: turn **off** *Allow new users to
   sign up*. Leave the **Email** provider **on**: it's what sends sign-in codes.
5. **Authentication → Emails → Magic Link**: subject
   `Your Investing Companion sign-in code`, body = contents of
   `supabase/templates/magic_link.html`.
6. **Authentication → URL Configuration**: set *Site URL* to the app's Vercel
   address (after step 2 below).
7. From the **Connect** button (or Project Settings → API Keys), copy the
   project URL and the **publishable** key.

### 2. Vercel (free Hobby plan)

1. Sign in at [vercel.com](https://vercel.com) with GitHub and import this repo.
2. Add the environment variables from `.env.example`.
3. Deploy. Then put the resulting URL into Supabase's *Site URL* (step 1.6).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

To run a throwaway Supabase on your own machine instead (needs Docker):
`npx supabase start`. It applies the migrations, and sign-in emails appear at
http://127.0.0.1:54324. Create your user with the Supabase Studio it prints.

Regenerate the app icons after changing `scripts/make-icons.mjs`:
`node scripts/make-icons.mjs`.
