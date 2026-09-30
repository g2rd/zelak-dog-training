# ZELAK Dog Training — website & student zone

Production web app for my dog-training business, live at **[zelak.pl](https://zelak.pl)**.
A fast, SEO-friendly business site combined with a logged-in **student zone** (training
programme for puppies and dogs, session cards, homework tasks, progress tracking) and a
**trainer panel** for managing participants, access codes and notifications.

> Portfolio copy of a private repository. Course content, internal notes and real
> customer data are removed. Source code shared for review only — all rights reserved.

## Tech stack

- **Frontend:** React 18, Vite, React Router 6, TanStack Query, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Row Level Security, RPC functions, Storage, Auth)
- **Serverless:** Supabase Edge Functions (Deno / TypeScript) — account deletion, trainer e-mail notifications, signed video URLs
- **Auth:** e-mail + password, Google Identity Services (One Tap)
- **Rendering & SEO:** static prerendering (SSR build + prerender script), per-city landing pages, structured data
- **Testing:** Vitest (unit tests), SQL tests for RLS policies, post-build checks
- **CI/CD:** GitHub Actions — tests + build on `dev`, automatic deploy on `main`
- **Workflow:** built with an AI-assisted development workflow (Claude Code), with every change reviewed and tested

## Features

- Business website: offer, process, service areas, contact, privacy policy
- Student zone: registration/login, "My dog" profiles, day-by-day programme, tasks, session cards
- Access control: trainer approval or one-time access codes with expiry, enforced by Postgres RLS
- Trainer panel: participants overview, per-participant progress, account deletion with confirmation
- E-mail notifications for the trainer (Edge Function)
- Protected video lessons via signed URLs

## Project structure

```
src/
  app/, pages/, sections/     public website (landing, city pages, contact)
  components/                 shared UI, layout, SEO
  kursy/                      student zone & trainer panel
    pages/, components/       views (programme, tasks, account, trainer)
    hooks/, lib/              data access (TanStack Query + Supabase)
supabase/
  migrations/                 schema, RLS policies, RPC functions
  functions/                  Edge Functions (Deno/TypeScript)
  tests/                      RLS tests
scripts/                      prerender & build checks
```

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in your own Supabase project values
npm run dev                  # http://localhost:5173
npm test                     # unit tests
npm run verify               # tests + build + post-build checks
```

## Author

**Łukasz Grzelak** — Frontend Developer (React / TypeScript / Next.js)
[LinkedIn](https://www.linkedin.com/in/lukasz-grzelak-g2rd/)
