# Time Tracker - Setup Guide

## Architecture Overview

```
┌─────────────────────────┐
│   iPhone / Browser      │  ← PWA installed on home screen
│   (Next.js frontend)    │
└────────┬────────────────┘
         │ HTTPS
┌────────▼────────────────┐
│   Vercel (serverless)   │  ← Next.js API routes
│                         │
│  /api/auth/*            │  ← Google OAuth via NextAuth.js
│  /api/clock   POST/PUT  │  ← Clock in / clock out
│  /api/entries GET/PUT/  │  ← List, edit, delete entries
│              DELETE      │
│  /api/status  GET       │  ← Current clock status + summaries
│  /api/sheet   POST      │  ← Initialize sheet headers
│  /api/push/subscribe    │  ← Save a device's push subscription
│  /api/reminders GET     │  ← Send clock-out reminders (cron)
└────────┬────────────────┘
         │ Google Sheets API (service account)
┌────────▼────────────────┐
│   Google Sheet          │  ← Data storage (your Google Drive)
│   Shared with service   │
│   account as Editor     │
└─────────────────────────┘
```

### How it works

1. **Authentication**: Users sign in with Google. Only emails in the allowlist (`src/lib/constants.ts`) are accepted. NextAuth.js handles OAuth and sessions.

2. **Data flow**: When you clock in/out, the Next.js API route (running on Vercel) writes to the Google Sheet using a service account. The service account is a separate Google identity that has Editor access to your sheet.

3. **Timezone**: All times are recorded in **Europe/Madrid** regardless of where the server or client is located, using `date-fns-tz`.

4. **PWA**: The app is installable on iPhone via "Add to Home Screen". A service worker caches the app shell for offline use and shows push notifications.

5. **Clock-out reminders**: Tapping Clock In asks for notification permission and saves the device's push subscription to a "Push Subscriptions" tab in the sheet. Every 5 minutes, [cron-job.org](https://cron-job.org) calls `/api/reminders`, which sends a Web Push notification to every saved device for each 2 hours (`REMINDER_MINUTES`) since clock-in, until you clock out. Column I of the active row records how many reminders have been sent.

6. **Deployment**: GitHub Actions deploys to Vercel on every push to `main`. PRs get preview deployments with a URL comment.

### Google Sheet structure

| Date | Day | Clock In | Clock Out | Hours | Status | Edited | Notes |
|------|-----|----------|-----------|-------|--------|--------|-------|
| 2026-03-25 | Tuesday | 09:00 | 17:30 | 8.50 | complete | false | |
| Week 13 - 2026-03 Summary | | | | 42.50 | summary | | |
| March 2026 Summary | | | | 170.00 | summary | | |

Summary rows are auto-inserted when you clock out across a week or month boundary.

---

## Setup from Scratch

If you want to fork this project and set it up for yourself, follow these steps.

### 1. Google Cloud Console

#### Create Project
1. Go to https://console.cloud.google.com
2. Create a new project (e.g., "TimeTracker")
3. Select the project

#### Enable APIs
1. Go to **APIs & Services > Library**
2. Enable **Google Sheets API**
3. Enable **Google Drive API**

#### OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in app name, support email, developer contact
4. Add scopes: `openid`, `email`, `profile`
5. Add your email(s) as test users
6. Save

#### OAuth 2.0 Credentials (for user login)
1. Go to **APIs & Services > Credentials**
2. **Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`
5. Copy the **Client ID** and **Client Secret**

#### Service Account (for Sheets API)
1. Go to **APIs & Services > Credentials**
2. **Create Credentials > Service Account**
3. Name it (e.g., `sheets-writer`), create it
4. Go to the service account > **Keys** tab > **Add Key > JSON**
5. Download the JSON — you need `client_email` and `private_key`

### 2. Google Sheet

The service account cannot create sheets directly. You must create one manually:

1. Go to https://sheets.new
2. Name it (e.g., "Time Tracker - Babysitting")
3. Click **Share** and add the service account email as **Editor**
4. Copy the **Sheet ID** from the URL: `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`

### 3. Environment Variables

Copy the template and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_URL` | Your app URL (`http://localhost:3000` for dev) |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GOOGLE_CLIENTID` | OAuth Client ID from Google Console |
| `GOOGLE_CLIENTSECRET` | OAuth Client Secret from Google Console |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email from JSON key |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Private key from JSON key (keep the `\n` characters) |
| `GOOGLE_SHEET_ID` | Sheet ID from step 2 |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push public key — generate a pair with `npx web-push generate-vapid-keys`. Must **not** be marked Sensitive in Vercel, since it's read at build time |
| `VAPID_PRIVATE_KEY` | Web Push private key from the same pair |
| `VAPID_SUBJECT` | Contact for push services, e.g. `mailto:you@example.com` |
| `CRON_SECRET` | Random secret that protects `/api/reminders` — generate with `openssl rand -hex 32` |

### 4. Local Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000, sign in, then go to `/setup` to initialize the sheet headers.

### 5. Deploy to Vercel

#### Link and configure
```bash
npx vercel link          # Creates .vercel/project.json
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENTID production
vercel env add GOOGLE_CLIENTSECRET production
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production
vercel env add GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY production
vercel env add GOOGLE_SHEET_ID production
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
vercel env add VAPID_PRIVATE_KEY production
vercel env add VAPID_SUBJECT production
vercel env add CRON_SECRET production
```

#### GitHub Actions (automated deploys)
Add these GitHub repository secrets:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Create at https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` → `projectId` |
| `CRON_SECRET` | Same value as in Vercel (used by the manual reminder workflow) |
| `APP_URL` | Your app URL with no trailing slash (used by the manual reminder workflow) |

Push to `main` and the GitHub Actions workflow handles the rest.

#### Clock-out reminders (cron-job.org)
1. Create a free account at https://cron-job.org
2. Create a cron job for `https://your-domain.com/api/reminders`, running every 5 minutes
3. Under **Advanced > Headers**, add `Authorization` with the value `Bearer <your CRON_SECRET>`
4. Use **Test run** to check it. It should return a JSON status such as `{"status":"not clocked in"}`

You can also trigger a check by hand from GitHub's Actions tab with the "Clock-out Reminders" workflow.

#### Custom domain (optional)
If using Cloudflare:
1. `vercel domains add subdomain.yourdomain.com`
2. Add a CNAME record in Cloudflare: `subdomain` → `cname.vercel-dns.com` (proxy OFF)
3. Update `NEXTAUTH_URL` to your custom domain
4. Add the new callback URI to Google OAuth credentials

### 6. Install on iPhone

1. Open the app URL in **Safari**
2. Tap the **Share** button (square with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add**
5. Open the app from the Home Screen icon and tap **Clock In** once to allow notifications. iOS only allows push notifications for Home Screen apps (iOS 16.4+)

### 7. Update Allowed Emails

Edit `src/lib/constants.ts` and change the `ALLOWED_EMAILS` array:

```ts
export const ALLOWED_EMAILS = [
  "your-email@gmail.com",
  "another-email@gmail.com",
];
```

Also add these emails as test users in the Google OAuth consent screen.
