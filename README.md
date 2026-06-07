# BINGO — Multiplayer Game

A real-time multiplayer Bingo application built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Supabase** (Auth, Database, Realtime).

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Supabase](https://img.shields.io/badge/Supabase-Realtime-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- Instant play — no sign-in required (anonymous sessions)
- Create & join rooms with 6-character shareable codes
- Real-time lobby with ready status
- Private 5×5 matrix entry with Excel-style keyboard navigation
- Live multiplayer gameplay with opponent tracking
- BINGO letter progression (B→I→N→G→O)
- In-game chat and live leaderboard
- Win screen with stats
- Player dashboard with history and global winners

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Realtime) |
| Deployment | Vercel + Supabase |

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo>
cd bingo-game
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql`
3. Run the schema in the SQL Editor — if you ran an older version, also run `supabase/guest-migration.sql`
4. Copy your project URL and anon key from Settings → API

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`)
4. Update Supabase Auth settings if deploying to production
5. Deploy!

## Project Structure

```
/app
  page.tsx                  Landing + Auth
  dashboard/page.tsx        Player dashboard
  dashboard/create/page.tsx Create room
  room/[code]/page.tsx      Lobby → Matrix → Game
  auth/callback/route.ts    OAuth callback
/components
  auth/                     Google login
  lobby/                    Lobby, join modal, create room
  game/                     Board, opponents, chat, win modal
  ui/                       GlassCard, BingoButton, Navbar
/hooks
  useRoom.ts                Room CRUD & lobby logic
  useGame.ts                Cell cancel & win detection
  useRealtime.ts            Supabase Realtime subscriptions
/lib
  bingo-logic.ts            12-line BINGO detection
  realtime.ts               Channel subscription helpers
  supabase/                 Client, server, middleware
/supabase
  schema.sql                Full database schema + RLS
```

## Game Flow

1. **Open app** → auto session, straight to dashboard
2. **Dashboard** → Create or join a room
3. **Lobby** → Players mark ready, host starts
4. **Matrix Entry** → Each player fills their private 5×5 grid
5. **Game** → Cancel cells to complete lines; first to BINGO wins
6. **Win Screen** → Stats + return to dashboard

## Shareable Room Links

```
https://yourdomain.com/room/ABC123
```

- New users are signed in automatically — no login screen
- Room links work directly: `/room/ABC123`

## License

MIT
