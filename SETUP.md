# Time Tracker - Setup Guide

## 1. Google Cloud Console Setup

### Create Project
1. Go to https://console.cloud.google.com
2. Create a new project named **"TimeTracker"**
3. Select the project

### Enable APIs
1. Go to **APIs & Services > Library**
2. Search and enable: **Google Sheets API**
3. Search and enable: **Google Drive API**

### OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in:
   - App name: `Time Tracker`
   - User support email: your email
   - Developer contact: your email
4. Click **Save and Continue**
5. Add scopes: `openid`, `email`, `profile` — click **Save and Continue**
6. Add test users:
   - `robgogoworku@gmail.com`
   - `tizbtalemayhu@gmail.com`
7. Click **Save and Continue**

### OAuth 2.0 Credentials (for user login)
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `Time Tracker Web`
5. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://YOUR-APP.vercel.app/api/auth/callback/google`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### Service Account (for Sheets API)
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > Service Account**
3. Name: `sheets-writer`
4. Click **Create and Continue** (skip optional steps)
5. Click on the created service account
6. Go to **Keys** tab > **Add Key > Create new key > JSON**
7. Download the JSON file
8. From the JSON, you need:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`

## 2. Local Development

```bash
# Copy env template
cp .env.example .env.local

# Fill in the values from Google Cloud Console
# Edit .env.local with your values

# Install dependencies
npm install

# Run dev server
npm run dev
```

Visit http://localhost:3000

## 3. First Use - Create the Google Sheet

1. Sign in with your Google account
2. The app will detect no `GOOGLE_SHEET_ID` is set
3. If you call `POST /api/sheet` (or add a setup button), it creates the sheet
4. Copy the returned sheet ID
5. Add it to `.env.local` as `GOOGLE_SHEET_ID`
6. Restart the dev server

## 4. Deploy to Vercel

### Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit - Time Tracker PWA"
git remote add origin https://github.com/YOUR-USERNAME/time-tracker.git
git push -u origin main
```

### Vercel Setup
1. Go to https://vercel.com and sign in with GitHub
2. Click **Import Project** and select your repository
3. In **Environment Variables**, add ALL variables from `.env.local`:
   - `NEXTAUTH_URL` = `https://YOUR-APP.vercel.app`
   - `NEXTAUTH_SECRET` = your secret
   - `GOOGLE_CLIENT_ID` = from Google Console
   - `GOOGLE_CLIENT_SECRET` = from Google Console
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = from service account JSON
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` = from service account JSON (paste the full key)
   - `GOOGLE_SHEET_ID` = (leave empty for now)
4. Click **Deploy**

### After First Deploy
1. Visit your deployed app
2. Sign in and create the sheet (call POST /api/sheet)
3. Copy the sheet ID
4. Go to Vercel > Project Settings > Environment Variables
5. Add `GOOGLE_SHEET_ID` with the sheet ID
6. Redeploy (Settings > Deployments > redeploy latest)

### Update Google OAuth Redirect URI
Add your production URL to the OAuth credentials:
`https://YOUR-APP.vercel.app/api/auth/callback/google`

## 5. Generate NEXTAUTH_SECRET

Run this to generate a secure secret:
```bash
openssl rand -base64 32
```

## 6. Install on iPhone

1. Open the app URL in Safari on your iPhone
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add**
5. The app icon will appear on your home screen
