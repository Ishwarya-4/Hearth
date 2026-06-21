# Hearth — Shared Calendar

A warm, shared calendar for families, teams, and friends. Invite people by email,
plan events together, and see a little avatar of *who* added each event — at a glance.

Built with **React 19 + TypeScript** on the frontend and **Supabase** (hosted
Postgres + authentication) on the backend.

---

## ✨ Features

- **Shared calendars** — create a calendar and invite people by email. When they
  sign up, they're added automatically and everyone sees the same events.
- **Events, tasks & reminders** — add events with title, description, location,
  start/end time, all-day toggle, color, and a reminder.
- **Who's who** — every event shows a small round avatar of the person who created
  it, so you can scan a week and instantly know whose plan is whose.
- **Multiple views** — **Day**, **3-day**, **Week**, **Month**, and an **Agenda**
  list view. Switch with one tap.
- **Search** — find events by title, description, or location across all your
  calendars at once.
- **Recurring events** — repeat an event daily, weekly, monthly, or yearly, with
  an optional "repeat until" date. Delete a single occurrence or the whole series.
- **Drag to reschedule** — drag a timed event in the Day/Week views to change its
  time, or drag an event onto another day in Month view. (Recurring events aren't
  draggable.)
- **Reminders** — set a reminder (5 min to 1 day before). The app shows a browser
  notification while the tab is open (see note below).
- **Secure login** — email + password, or "Continue with Google". Data is protected
  per-user with database row-level security (you only see calendars you're a member of).
- **Responsive** — works on laptop and mobile; the sidebar collapses into a slide-out
  menu on small screens.

> **Not built yet:** Google / Outlook calendar **import/sync**. The Google button
> currently signs you *in* with Google but does not yet pull in your Google Calendar
> events. See [Roadmap](#-roadmap).
>
> **Reminders note:** reminders use the browser's Notification API and only fire
> while the app tab is open (events within the next 24h are scheduled). True
> background/push reminders would need a server + service worker — see Roadmap.

---

## 🧰 Tech stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Language | TypeScript |
| Routing / SSR | TanStack Start + TanStack Router |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 + shadcn/ui components |
| Build tool | Vite 8 |
| Backend (auth + database) | Supabase (hosted Postgres) |

The backend is **already hosted on Supabase** — you do not need to run a database
locally. The connection details live in the `.env` file (already filled in).

---

## ✅ Prerequisites

- **Node.js 20 or newer** (this project was verified on Node 24).
  Check with: `node -v`
- **npm** (comes with Node). Check with: `npm -v`

That's it — no database to install.

---

## 🚀 Run the project locally

From the project folder (`shared-vibe-calendar-main`):

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the development server
npm run dev
```

Then open **http://localhost:8080** in your browser.

The dev server supports hot reload — save a file and the page updates automatically.

### First time using the app

1. Click **Get started** → **Create one** to make an account (email + password).
2. You'll land on your personal calendar ("My Calendar").
3. Click any time slot, or the **New event** button, to add an event.
4. To share: open the sidebar, hover a calendar, click the **people icon**, and
   invite someone by their email address. When they sign up with that email, the
   calendar appears on both your accounts.

---

## 🛠️ Other commands

```bash
npm run build      # Production build
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint
npm run format     # Auto-format code with Prettier
```

---

## 🔐 Environment variables

These are stored in `.env` (already configured for the connected Supabase project):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (used by the browser) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase public (anon) key |
| `SUPABASE_URL` | Same URL, used during server-side rendering |
| `SUPABASE_PUBLISHABLE_KEY` | Same key, used during server-side rendering |

> The publishable/anon key is **safe to expose** in the browser — it only allows
> actions permitted by the database's row-level security policies. Never commit a
> Supabase *service-role* (secret) key to this file.

---

## 🗂️ Project structure

```
shared-vibe-calendar-main/
├─ .env                       # Supabase connection (already set up)
├─ package.json               # Scripts & dependencies
├─ vite.config.ts             # Build/dev config (port 8080)
├─ src/
│  ├─ routes/                 # Pages (file-based routing)
│  │  ├─ index.tsx            #   "/"      landing page
│  │  ├─ auth.tsx             #   "/auth"  sign in / sign up
│  │  └─ _authenticated/
│  │     └─ app.tsx           #   "/app"   the main calendar app
│  ├─ components/
│  │  ├─ calendar/            # Calendar views, event & member dialogs, avatars
│  │  └─ ui/                  # Reusable UI building blocks (shadcn/ui)
│  ├─ integrations/supabase/  # Supabase client & types
│  └─ lib/                    # Date helpers, utilities
└─ supabase/
   └─ migrations/             # Database schema (tables, security rules, triggers)
```

---

## 🗄️ How the data is organized

The database (in `supabase/migrations/`) has these main tables:

- **profiles** — one per user (name, avatar, personal color).
- **calendars** — each user gets a personal calendar; shared ones can be created too.
- **calendar_members** — links people to calendars (with a role: owner / editor / viewer).
- **events** — the actual events, each linked to a calendar and its creator.
- **invitations** — pending email invites; auto-accepted when that person signs up.

Security ("row-level security") is enforced **in the database**, so a user can only
ever read or change calendars and events they're a member of — even if someone
tampered with the frontend.

### Setting up the database on a fresh Supabase project

1. Create a project at https://supabase.com.
2. Open **SQL Editor → New query**, paste the entire contents of
   [supabase/schema.sql](supabase/schema.sql), and click **Run**. This creates all
   tables, security rules, triggers, and the recurring-event columns.
3. Copy your **Project URL** and **anon/public key** (Project Settings → API) into
   the `.env` file (the `VITE_SUPABASE_*` and `SUPABASE_*` values).
4. (Optional) Authentication → Sign In / Providers → Email → turn **off**
   "Confirm email" so you can log in immediately without a confirmation link.

> **Already have the older tables?** If your database was created before recurring
> events, run [supabase/migrations/20260620100000_recurring_events.sql](supabase/migrations/20260620100000_recurring_events.sql)
> once in the SQL Editor to add the new columns.

---

## 🧭 Roadmap (possible next steps)

- [ ] **Google Calendar import/sync** — pull events from a connected Google account.
- [ ] **Outlook Calendar import/sync** — same for Microsoft accounts.
- [x] Recurring events (daily/weekly/monthly/yearly repeats).
- [x] Browser notifications for reminders (while the tab is open).
- [ ] Background/push reminders (needs a server + service worker).
- [x] Drag-to-reschedule events.

> Google/Outlook sync requires free developer API credentials from Google Cloud
> Console and Microsoft Azure. That setup was intentionally deferred — see the
> conversation notes.

---

## 🩹 Troubleshooting

| Problem | Fix |
|---|---|
| `Missing Supabase environment variable(s)` error | Make sure `.env` exists in the project root and contains the `VITE_SUPABASE_*` values, then restart `npm run dev`. |
| Port 8080 already in use | Stop the other process, or change the port in `vite.config.ts`. |
| Blank page after sign-up | Check your email for a confirmation link (Supabase may require email confirmation depending on project settings). |
| Changes not showing | Hard-refresh the browser (Ctrl+Shift+R). |

---

## 📝 Notes

This project is connected to [Lovable](https://lovable.dev). Commits pushed to the
connected branch sync back to the Lovable editor, so avoid rewriting published git
history (no force-push / rebase of already-pushed commits).
