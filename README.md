# 🏆 FF Tournament — India's No.1 Free Fire Tournament Platform

A production-ready Progressive Web App (PWA) for hosting Free Fire custom tournaments. Built with Next.js, TypeScript, Tailwind CSS, Framer Motion, and **Firebase** (Auth + Firestore + Storage).

> **Tagline:** Join exciting Free Fire custom tournaments, compete with real players, and win cash prizes.

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Quick Start](#-quick-start)
4. [Project Structure](#-project-structure)
5. [Database Schema (Firestore Collections)]#-database-schema-firestore-collections)
6. [Authentication](#-authentication)
7. [API Reference](#-api-reference)
8. [PWA Setup](#-pwa-setup)
9. [Firestore Security Rules](#-firestore-security-rules)
10. [Admin Setup](#-admin-setup)
11. [Deployment Guide (Vercel)](#-deployment-guide-vercel)
12. [GitHub Setup](#-github-setup)
13. [Environment Variables](#-environment-variables)
14. [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### User-Facing
- 🎮 **1v1 & 2v2 Clash Squad** tournaments with cash prizes
- 🔐 **Google Login** via Firebase Authentication
- 💳 **UPI Payment Flow** — QR code, UPI ID, screenshot upload to Firebase Storage, UTR verification
- 📊 **User Dashboard** — upcoming matches, joined tournaments, payment status, notifications, match history, prize history
- 🏆 **Leaderboard** — top winners, most matches played, highest prize earned
- 🔔 **Notifications** — payment approved/rejected, room published, tournament completed
- 📱 **PWA** — installable, offline support, splash screen, app icons
- 🎨 **Dark Gaming Theme** — neon green + orange accents, glassmorphism, glow effects

### Admin Panel
- 📈 **Dashboard Statistics** — total users, registrations, payments, active/completed tournaments
- 🏟️ **Tournament Management** — create, edit, delete, activate/deactivate
- 💰 **Payment Verification** — view screenshot (from Storage), UTR, player details; approve/reject
- 🔑 **Room Management** — publish Room ID & Password (visible only to approved players)
- 🏆 **Match Completion** — mark tournament completed, select winner, enter prize amount
- 📊 Auto-updates **leaderboard**, **winner history**, **user prize history**

### Design & UX
- ⚡ **Framer Motion** animations (hover, fade, page transitions, counters, loading skeletons, glow effects)
- 📱 **Mobile-first responsive** — Android, iPhone, tablet, desktop
- 🌈 **Color palette**: Black `#050507`, Dark Gray `#0c0c12`, Neon Green `#00ff9d`, Orange `#ff6b1a`, White
- ♿ **Accessibility** — semantic HTML, ARIA labels, keyboard navigation, screen reader support
- 🔍 **SEO Optimized** — metadata, Open Graph, Twitter cards, robots.txt

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router) |
| Language | **TypeScript 5** (strict) |
| Styling | **Tailwind CSS 4** + shadcn/ui |
| Animations | **Framer Motion 12** |
| State | **Zustand** + **TanStack Query** |
| Auth | **Firebase Authentication** (Google Sign-In) |
| Database | **Firebase Firestore** (production mode) |
| File Storage | **Firebase Storage** (payment screenshots) |
| Admin SDK | **firebase-admin** (server-side, verifies ID tokens + bypasses security rules for admin ops) |
| PWA | Web Manifest + Service Worker |
| Deployment | **Vercel** |
| Version Control | **GitHub** |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (or [Bun](https://bun.sh) 1.1+)
- A Firebase project (free tier is fine)

### 1. Create Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add Project**
2. **Enable Authentication** → Sign-in method → **Google** (toggle on, configure support email)
3. **Create Firestore Database** (production mode — choose region `asia-south1` for India)
4. **Create Storage** bucket (same region)
5. **Add a Web App** (Project Settings → General → Your apps → Web) → copy the 6 config values starting with `NEXT_PUBLIC_FIREBASE_*`
6. **Generate Service Account Key** (Project Settings → Service Accounts → Generate new private key) → save the JSON file securely

### 2. Set Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `SESSION_SECRET` — generate with `openssl rand -hex 32`
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` — from step 1.5
- `FIREBASE_SERVICE_ACCOUNT` — paste the **entire JSON** from step 1.6 as a single line (use single quotes)

### 3. Install & Run

```bash
bun install                      # or: npm install
bun run dev                      # starts on http://localhost:3000
```

### 4. Authorize Your Domain

In Firebase Console → **Authentication → Settings → Authorized domains** → add `localhost` (already there) and your production domain later.

### 5. Seed Demo Tournaments

After first run, hit the seed endpoint to populate 4 demo tournaments:

```bash
curl -X POST http://localhost:3000/api/seed
```

Or just open the homepage — it auto-seeds on first load.

### 6. Make Yourself Admin

1. Sign in once with your Google account (this creates your user doc in Firestore)
2. Open Firebase Console → **Firestore Database** → `users` collection
3. Find your user doc → edit the `role` field: change `"user"` → `"admin"`
4. Refresh the app → **Admin Panel** appears in your profile menu

---

## 📁 Project Structure

```
ff-tournament/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── sw.js                      # Service Worker
│   ├── offline.html               # Offline fallback page
│   ├── icon-192.png, icon-512.png # PWA icons
│   └── og-image.png               # Open Graph image
├── scripts/
│   └── generate-icons.py          # Icon generation script
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (PWA metadata, providers)
│   │   ├── page.tsx               # Home page (all sections)
│   │   ├── globals.css            # Dark gaming theme + animations
│   │   └── api/
│   │       ├── auth/              # /session, /logout, /me
│   │       ├── tournaments/       # /, /detail
│   │       ├── registrations/     # POST (register + payment)
│   │       ├── payments/          # GET, POST (verify)
│   │       ├── admin/             # /tournaments, /rooms, /complete, /stats
│   │       ├── notifications/     # GET, POST (mark read)
│   │       ├── leaderboard/       # GET
│   │       ├── stats/             # GET (homepage counters)
│   │       ├── dashboard/         # GET (user dashboard data)
│   │       └── seed/              # POST (seed demo tournaments)
│   ├── components/
│   │   ├── ui/                    # shadcn/ui primitives
│   │   ├── sections/              # Homepage sections (hero, banner, stats, etc.)
│   │   ├── modals/                # Login, Tournament, Payment, Dashboard, Admin, Info
│   │   ├── auth-provider.tsx      # Firebase Auth context
│   │   └── providers.tsx          # QueryClient, Tooltip, Auth, SW registration
│   ├── lib/
│   │   ├── firebase-client.ts     # Firebase client SDK (auth, firestore, storage)
│   │   ├── firebase-admin.ts      # Firebase Admin SDK (server-side)
│   │   ├── auth.ts                # Session management + ID token verification
│   │   ├── constants.ts           # Trust cards, FAQs, announcements
│   │   └── utils.ts               # cn() helper
│   ├── stores/
│   │   └── ui-store.ts            # Zustand modal/scroll state
│   └── hooks/
│       ├── use-mobile.ts
│       └── use-toast.ts
├── .env.example
├── package.json
└── README.md
```

---

## 🗄 Database Schema (Firestore Collections)

| Collection | Document Fields | Purpose |
|-----------|-----------------|---------|
| `users` | `uid, name, email, photoURL, role, registeredAt` | Player & admin profiles |
| `tournaments` | `type, title, entryFee, prizeAmount, slotLimit, filledSlots, date, time, roomId, roomPassword, roomPublished, status, rules, winnerId, createdAt` | Tournament config |
| `registrations` | `userId, tournamentId, status, note, createdAt, updatedAt` | User ↔ Tournament join (status: pending/approved/rejected) |
| `paymentRequests` | `userId, tournamentId, registrationId, screenshotURL, utrNumber, amount, note, status, submittedAt, reviewedAt` | Payment proof |
| `notifications` | `userId, title, message, type, read, createdAt` | User notifications |
| `leaderboard` | `userId, matchesPlayed, wins, prizeEarned` | Aggregated stats per user |
| `prizeHistory` | `userId, tournamentId, amount, createdAt` | Record of each prize won |
| `announcements` | `text, active, createdAt` | Marquee bar messages (optional) |
| `settings` | `key, value` | App-wide settings (optional) |

### Key Relationships

```
users 1───* registrations *───1 tournaments
users 1───* paymentRequests *───1 tournaments
registrations 1───1 paymentRequests
tournaments 1───* prizeHistory *───1 users
users 1───1 leaderboard
users 1───* notifications
```

---

## 🔐 Authentication

This app uses **Firebase Authentication** with **Google Sign-In** plus a **server-side session cookie** pattern:

### Flow

1. **Client** calls `signInWithPopup(auth, googleProvider)` → user picks Google account
2. **Client** gets a **Firebase ID token** (JWT, ~1hr validity)
3. **Client** POSTs `{ idToken }` to `/api/auth/session`
4. **Server** uses `firebase-admin`'s `verifyIdToken(idToken)` to validate the token
5. **Server** looks up (or creates) the user doc in Firestore `users` collection
6. **Server** creates an **HMAC-signed session cookie** containing the user's `uid` (7-day TTL)
7. **Subsequent requests** — server reads the cookie, verifies HMAC signature, fetches user doc from Firestore

### Why HMAC sessions instead of Firebase session cookies?

Firebase has its own `createSessionCookie()` API, but it requires:
- A different cookie name and verification flow per route
- More verbose code per protected route

The HMAC approach is simpler and equally secure for this app's needs. The `uid` is verified once (via Firebase ID token) at login, then trusted via HMAC signature for 7 days.

### Why firebase-admin?

The Admin SDK is used server-side to:
- **Verify ID tokens** (`verifyIdToken`) — proves the user really signed in with Google
- **Bypass Firestore Security Rules** for legitimate admin operations (creating tournaments, verifying payments, publishing rooms, completing matches)
- **Atomic transactions** (e.g., incrementing `filledSlots` while creating a registration)

The Admin SDK is initialized from the `FIREBASE_SERVICE_ACCOUNT` env var (a JSON string you set in Vercel).

---

## 📡 API Reference

All routes are under `/api/`. Authentication uses the `ff_session` cookie.

### Auth

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/session` | Exchange Firebase ID token for session cookie | Public |
| `POST` | `/api/auth/logout` | Clear session | Public |
| `GET` | `/api/auth/me` | Get current user | Public |

### Tournaments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/tournaments` | List active tournaments | Public |
| `GET` | `/api/tournaments/detail?id=...` | Get tournament + my registration status | Public |

### Registration & Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/registrations` | Register + submit payment (screenshot URL, UTR) | User |
| `GET` | `/api/payments` | List payments (own / all if admin) | User |
| `POST` | `/api/payments` | Approve/reject payment `{ paymentId, action }` | Admin |

### Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/stats` | Dashboard statistics | Admin |
| `GET` | `/api/admin/tournaments` | List ALL tournaments | Admin |
| `POST` | `/api/admin/tournaments` | Create tournament | Admin |
| `PUT` | `/api/admin/tournaments` | Update tournament | Admin |
| `DELETE` | `/api/admin/tournaments?id=...` | Delete tournament | Admin |
| `POST` | `/api/admin/rooms` | Publish room details | Admin |
| `POST` | `/api/admin/complete` | Mark completed + select winner + enter prize | Admin |

### Other

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/dashboard` | User dashboard data | User |
| `GET` | `/api/notifications` | User notifications | User |
| `POST` | `/api/notifications` | Mark all as read | User |
| `GET` | `/api/leaderboard` | Top winners, most matches, highest prize | Public |
| `GET` | `/api/stats` | Homepage animated counters | Public |
| `POST` | `/api/seed` | Seed demo data (idempotent) | Public |

---

## 📱 PWA Setup

The app is a fully installable PWA. Key files:

| File | Purpose |
|------|---------|
| `public/manifest.json` | App manifest (name, icons, theme, shortcuts) |
| `public/sw.js` | Service worker (caches app shell, offline fallback) |
| `public/offline.html` | Offline fallback page |
| `public/icon-192.png`, `icon-512.png` | App icons |
| `public/screenshot-mobile.png` | Install prompt screenshot |
| `src/app/layout.tsx` | PWA metadata, apple-mobile-web-app tags |

### Install on Mobile

1. Open the deployed URL in Chrome (Android) or Safari (iOS)
2. Browser will prompt "Add to Home Screen" — or use browser menu → "Install app"

---

## 🛡 Firestore Security Rules

Copy these to Firebase Console → Firestore → Rules → Publish:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: can read own profile, admins can read all
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    // Tournaments: public read for active, admin-only write
    match /tournaments/{tournamentId} {
      allow read: if resource.data.status == 'active' || isAdmin();
      allow create, update, delete: if isAdmin();
    }

    // Registrations: user creates own, admin reads all
    match /registrations/{regId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Payment requests: user creates own, admin verifies
    match /paymentRequests/{paymentId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    // Notifications: user reads/updates own only
    match /notifications/{notifId} {
      allow read, update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if isAdmin();
      allow delete: if isAdmin();
    }

    // Leaderboard: public read, admin/system write only
    match /leaderboard/{entryId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Prize history: user reads own, admin writes
    match /prizeHistory/{entryId} {
      allow read: if request.auth != null && (resource.data.userId == request.auth.uid || isAdmin());
      allow create, update, delete: if isAdmin();
    }

    // Announcements: public read, admin write
    match /announcements/{annId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Settings: public read, admin write
    match /settings/{settingId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    function isAdmin() {
      return request.auth != null &&
        exists(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Storage Rules (for payment screenshots)

Firebase Console → Storage → Rules → Publish:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Payment screenshots: only owner can read, only authenticated users can write
    match /payments/{userId}/{fileName} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && request.auth.uid == userId
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // Tournament banners: public read, admin write
    match /banners/{fileName} {
      allow read: if true;
      allow write: if isAdmin();
    }

    function isAdmin() {
      return request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## 👑 Admin Setup

After deploying:

1. Sign in once with your Google account (creates your user doc in Firestore)
2. Open Firebase Console → **Firestore Database** → `users` collection
3. Find your user doc → edit the `role` field: change `"user"` → `"admin"`
4. Refresh the app → **Admin Panel** appears in your profile menu

---

## 🚢 Deployment Guide (Vercel)

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: FF Tournament PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ff-tournament.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework Preset: **Next.js** (auto-detected)
4. **DO NOT click Deploy yet** — first add Environment Variables (see below)
5. After env vars are set → click **Deploy**

### Step 3: Set Environment Variables on Vercel

In Vercel Project Settings → Environment Variables, add all of these:

| Name | Value | Encrypted | Environments |
|------|-------|-----------|--------------|
| `SESSION_SECRET` | (random 32+ char hex from `openssl rand -hex 32`) | Yes | Production, Preview, Development |
| `FIREBASE_SERVICE_ACCOUNT` | (entire JSON from service account key file) | Yes | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIza...` | No | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `ff-tournament.firebaseapp.com` | No | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `ff-tournament` | No | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `ff-tournament.appspot.com` | No | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `1234567890` | No | Production, Preview, Development |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:1234:web:abc` | No | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | No | Production |

> **Tip**: For `FIREBASE_SERVICE_ACCOUNT`, paste the entire JSON contents (including the curly braces `{...}`) as the value. Vercel will treat it as a string.

### Step 4: Deploy & Authorize Domain

1. Click **Deploy** → wait ~2 minutes → live URL appears
2. Copy the Vercel URL
3. Go to **Firebase Console → Authentication → Settings → Authorized domains** → add your Vercel domain (`your-project.vercel.app` and any custom domain)

### Step 5: Make Yourself Admin

Follow the [Admin Setup](#-admin-setup) steps above.

---

## 🐙 GitHub Setup

### `.gitignore` (essential entries — already in repo)

```gitignore
node_modules/
.next/
out/
build/
dist/

.env
.env.local
.env.production.local
.env.development.local

*.db
*.db-journal

.DS_Store
*.pem
.vscode/
.idea/

.vercel

*.log
```

> ⚠️ **NEVER commit `.env` to git** — it contains your `FIREBASE_SERVICE_ACCOUNT` which grants full admin access to your Firebase project. The default `.gitignore` already excludes it.

### Optional: GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
```

---

## 🔧 Environment Variables

Create `.env` (or `.env.local`) locally:

```env
# Session secret — generate with: openssl rand -hex 32
SESSION_SECRET="..."

# App URL (your Vercel domain in production)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Firebase client config (public — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY="AIza..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ff-tournament.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ff-tournament"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ff-tournament.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="1234567890"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234:web:abc"

# Firebase service account (server-only — NEVER share, NEVER commit)
# Paste the ENTIRE JSON file contents from Firebase Console → Service Accounts → Generate new private key
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
```

See `.env.example` for a full template.

---

## 🐛 Troubleshooting

### Common Issues

**1. "FIREBASE_SERVICE_ACCOUNT env var is not set"**
- You didn't add the env var to Vercel. Go to Project Settings → Environment Variables → add `FIREBASE_SERVICE_ACCOUNT` with the entire JSON → Redeploy.
- Locally: ensure `.env` has the line `FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'` (single quotes around JSON).

**2. "Firebase: unauthorized domain"**
- Add your domain (localhost, your-project.vercel.app, custom domain) in Firebase Console → Authentication → Settings → Authorized domains.

**3. Google login popup blocked**
- Some browsers block popups. The login button shows a toast error. User can click the icon in address bar to allow popups for this site.

**4. Screenshot upload fails with "permission denied"**
- Storage rules aren't published. Copy the Storage Rules from this README → Firebase Console → Storage → Rules → Publish.
- Make sure your user is authenticated before uploading (the upload uses the Firebase client SDK which respects Storage rules).

**5. Admin Panel not visible**
- You're not an admin. After Google login, go to Firebase Console → Firestore → `users` → your doc → set `role` to `"admin"` → refresh app.

**6. Stats / leaderboard show 0 in production**
- This is normal right after deployment. Stats are real once users start joining tournaments. The homepage has demo baseline numbers baked in so it never looks empty.

**7. Tournament cards don't load**
- Run `curl -X POST https://your-project.vercel.app/api/seed` once after deployment to seed 4 demo tournaments.

**8. PWA not installable**
- Service worker only registers in production builds. On Vercel, production builds are the default — should work out of the box.
- For local testing: Chrome DevTools → Application → Manifest → "Install" button.

**9. Hydration warnings in console**
- This is a known issue with Radix UI Accordions on SSR. Already mitigated in `src/components/sections/faq-section.tsx` with `suppressHydrationWarning` + deferred render. Warnings are cosmetic and don't affect functionality.

**10. ID token verification fails**
- Server clock skew — should not happen on Vercel.
- User revoked account — they need to sign in again.
- Token expired — client auto-refreshes via `onAuthStateChanged`, but if the user closed the app for >1hr, they may need to login again. Session cookie still valid for 7 days though.

### Getting Help

- 💬 Telegram: [@fftournament](https://t.me/fftournament)
- 📷 Instagram: [@ff.tournament.india](https://instagram.com/ff.tournament.india)
- 📧 Email: support@fftournament.in

---

## 📄 License

MIT License — feel free to use this project for your own Free Fire tournament platform.

---

## 🙏 Credits

Built with ❤️ for Indian Free Fire gamers. Powered by Next.js, Tailwind CSS, shadcn/ui, Framer Motion, and Firebase.

**Made for gamers, by gamers.** 🎮🏆
