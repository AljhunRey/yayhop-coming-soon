# yayhop — PRD

## Original problem statement
> Create a website for my app — a temporary landing page saying yayhop is under development, with a join waitlist. Company logo and colors provided from the mobile app.

## Decisions / Inputs from user
- Tagline: "Schedule rides, share travels and help with pasabuys."
- Contact email displayed: `official@yayhop.com`
- Theme: Auto light/dark via system preference, using exact brand tokens from the mobile app (light `#f3efe8` / dark `#03314b` / accent `#ff760e`)
- Font: Satoshi family (Fontshare)
- Waitlist: store in MongoDB; admin endpoint protected by key (user will view signups via endpoint). Email notifications skipped for now.
- No socials, no countdown, just "Coming Soon".
- More images/graphics to be added later by user.
- User has own domain + Supabase (migration is a future task, built-in MongoDB used for now).

## Architecture
- **Backend**: FastAPI + Motor (async Mongo) — `/app/backend/server.py`
  - `POST /api/waitlist` — join
  - `GET /api/waitlist/count` — public counter
  - `GET /api/waitlist/admin?key=` — list all (protected by `ADMIN_KEY` in `.env`)
- **Frontend**: React 19 + Tailwind + Satoshi
  - Single landing page at `/app/frontend/src/pages/Landing.jsx`
  - Auto dark/light via `@media (prefers-color-scheme: dark)` swapping CSS vars and logo variants
  - Brand-tokenized CSS in `/app/frontend/src/index.css`
  - Toaster via `sonner`

## Implemented (Dec 2025)
- Waitlist API (join, count, admin) with duplicate prevention
- Responsive landing: nav, hero with animated hopping bunny, 3 feature teasers, contact strip, footer
- Auto dark/light mode
- Waitlist form with toast feedback + live signup counter
- Admin key seeded in `.env`, documented in `/app/memory/test_credentials.md`

## Backlog (P1 / P2)
- P1: Email notifications on signup (Resend → `official@yayhop.com`) — user opted to skip for now
- P1: Migration from built-in Mongo to user's Supabase — at deploy time
- P2: Custom OG/Twitter share image, favicon with yayhop bunny
- P2: Add more brand graphics once user uploads them
- P2: Simple admin UI (HTML table) for waitlist instead of raw JSON
- P2: Launch countdown once date is set
