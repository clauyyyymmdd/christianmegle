# Christianmegle

An Omegle-style video confession booth. Two user types: **Priests** and **Sinners**. Priests must pass a bible quiz and be manually approved. Sinners confess via live video.

## Architecture

```
┌─────────────────┐     ┌──────────────────────────┐
│   React App     │◄───►│  Cloudflare Worker        │
│   (Vite + TS)   │ WS  │  + Durable Objects        │
│                 │     │  (Signaling + Matchmaking) │
└────────┬────────┘     └──────────────────────────┘
         │                        │
         │ WebRTC (P2P Video)     │ D1 Database
         │                        │ (Priest applications,
         ▼                        │  quiz data, approvals)
┌─────────────────┐              ▼
│  Other Browser  │     ┌──────────────────┐
│  (Priest/Sinner)│     │  Cloudflare D1   │
└─────────────────┘     └──────────────────┘
```

## Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Signaling**: Cloudflare Workers + Durable Objects (WebSocket)
- **Database**: Cloudflare D1 (SQLite at edge)
- **Video**: WebRTC (peer-to-peer)
- **STUN**: Google public STUN servers
- **TURN**: Metered.ca free tier (or Cloudflare Calls)
- **Styling**: CSS with gothic/church aesthetic

## Project Structure

```
christianmegle/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── VideoChat.tsx  # WebRTC video component
│   │   ├── WaitingRoom.tsx
│   │   ├── BibleQuiz.tsx
│   │   ├── PriestApplication.tsx
│   │   └── AdminPanel.tsx
│   ├── pages/
│   │   ├── Landing.tsx    # Role selection
│   │   ├── Confessional.tsx
│   │   └── Admin.tsx
│   ├── lib/
│   │   ├── webrtc.ts      # WebRTC connection logic
│   │   ├── signaling.ts   # WebSocket signaling client
│   │   └── types.ts       # Shared types
│   ├── styles/
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── worker/
│   ├── index.ts           # Cloudflare Worker entry
│   ├── signaling.ts       # Durable Object for signaling
│   ├── matchmaker.ts      # Durable Object for matching
│   └── api.ts             # REST endpoints (priest mgmt)
├── db/
│   └── schema.sql         # D1 database schema
├── wrangler.toml          # Cloudflare config
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Setup

1. `npm install`
2. `cp .env.example .env` and add your TURN server credentials
3. `npx wrangler d1 create christianmegle-db`
4. `npx wrangler d1 execute christianmegle-db --file=./db/schema.sql`
5. `npm run dev` (frontend)
6. `npx wrangler dev` (worker)

## Deployment

1. `npm run build`
2. `npx wrangler deploy`
3. Configure custom domain in Cloudflare dashboard
