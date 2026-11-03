# Time Tracker

A simple PWA for tracking work hours. Clock in when you start, clock out when you're done. All data is saved to a Google Sheet.

Built for personal use — only authorized Google accounts can access the app.

## Features

- **Clock In / Clock Out** — one-tap time tracking
- **Live Timer** — see elapsed time while clocked in
- **Google Sheets Backend** — all entries stored in a Google Sheet you own
- **History & Editing** — view, edit, and delete past entries
- **Date Range Calculator** — select a period and see total hours worked
- **Monthly Breakdown** — hours worked per month at a glance
- **Weekly & Monthly Summaries** — auto-inserted summary rows in the sheet
- **Clock-out Reminders** — push notification every 2 hours while you're still clocked in
- **Installable PWA** — add to home screen on iPhone/Android
- **Offline Support** — cached app shell with last known data

## Tech Stack

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [NextAuth.js](https://next-auth.js.org/) (Google OAuth)
- [Google Sheets API](https://developers.google.com/sheets/api) (via service account)
- [Tailwind CSS](https://tailwindcss.com/)
- [@ducanh2912/next-pwa](https://github.com/AugusDogus/next-pwa)
- Deployed on [Vercel](https://vercel.com/)

## Architecture

```
PWA (Next.js on Vercel)
├── Google OAuth (NextAuth.js) — email allowlist
├── API Routes (serverless) — clock in/out, entries CRUD
├── Google Sheets API (service account) — data storage
├── Web Push (cron-job.org → /api/reminders) — clock-out reminders
└── Service Worker — offline caching + push notifications
```

All times are recorded in the **Europe/Madrid** timezone.

## Setup

See [SETUP.md](SETUP.md) for full setup instructions including Google Cloud Console configuration, environment variables, and Vercel deployment.

## Development

```bash
npm install
cp .env.example .env.local
# Fill in your environment variables
npm run dev
```

## Deployment

Deployments are automated via GitHub Actions:
- **Push to `main`** → production deploy to Vercel
- **Pull request** → preview deploy with URL comment

## License

This is a personal project. Feel free to fork and adapt for your own use.
