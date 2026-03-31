# Real-Time Collaborative Task Board

A production-grade Kanban board with real-time collaboration, role-based access control, drag-and-drop task management, task comments, file attachments, and email notifications.

## Features

- Real-time collaborative Kanban board with Socket.io
- JWT authentication with access + refresh tokens
- Role-based access control (Admin / Member / Viewer)
- Drag-and-drop task reordering across columns (@hello-pangea/dnd)
- Task comments — create, edit, delete with live updates
- File attachments — upload to Supabase Storage, up to 10MB per file
- Email notifications via Resend — task assignment, comments, board invites
- Per-user email notification toggle in Settings

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│  Next.js 14 (App Router) + Tailwind CSS + Zustand           │
│  @hello-pangea/dnd (drag & drop) + socket.io-client         │
└────────────────────┬──────────────────────┬─────────────────┘
                     │ REST (HTTP/JSON)      │ WebSocket
                     ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (Node.js)                         │
│  Express.js REST API + Socket.io                            │
│  JWT Auth (access 15m / refresh 7d) + RBAC middleware       │
└────────────────────────────┬────────────────────────────────┘
                             │ Prisma ORM
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                        │
│  Users · Boards · Columns · Tasks · BoardMembers            │
└─────────────────────────────────────────────────────────────┘

Deployment:
  Frontend → Vercel
  Backend  → Render
  CI/CD    → GitHub Actions
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm 9+

> Windows users: Use PowerShell or Windows Terminal. Do not use Git Bash for npm scripts as path resolution may differ.

### 1. Clone & install

```bash
git clone <repo-url>
```

Then install each workspace separately (avoids cross-platform `&&` issues):

```bash
npm install
```
```bash
cd server
npm install
```
```bash
cd apps/web
npm install
```

### 2. Configure environment

On macOS/Linux:
```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local
```

On Windows PowerShell:
```powershell
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
```

Edit `.env` — fill in `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.  
Edit `apps/web/.env.local` — fill in `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`.

### 3. Database setup

```bash
npx prisma generate --schema=./prisma/schema.prisma
npx prisma migrate dev --name init --schema=./prisma/schema.prisma
```

### 4. Run development servers

Open two terminals:

Terminal 1 — backend (port 4000):
```bash
cd server
npm run dev
```

Terminal 2 — frontend (port 3000):
```bash
cd apps/web
npm run dev
```

Open http://localhost:3000

---

## Environment Variables

### Server (`/.env`)

| Variable             | Description                              | Example                          |
|----------------------|------------------------------------------|----------------------------------|
| `DATABASE_URL`       | PostgreSQL connection string             | `postgresql://user:pw@host/db`   |
| `JWT_SECRET`         | Secret for signing access tokens         | random 64-char string            |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens        | random 64-char string            |
| `CLIENT_URL`         | Frontend URL for CORS                    | `http://localhost:3000`          |
| `PORT`               | Express server port                      | `4000`                           |
| `SOCKET_CORS_ORIGIN` | Socket.io CORS origin                    | `http://localhost:3000`          |
| `SUPABASE_URL`       | Supabase project URL                     | `https://xxx.supabase.co`        |
| `SUPABASE_SERVICE_KEY` | Supabase service role key              | from Supabase dashboard          |
| `RESEND_API_KEY`     | Resend API key for email notifications   | from resend.com                  |

### Frontend (`/apps/web/.env.local`)

| Variable                  | Description              | Example                    |
|---------------------------|--------------------------|----------------------------|
| `NEXT_PUBLIC_API_URL`     | Backend REST API base URL| `http://localhost:4000`    |
| `NEXT_PUBLIC_SOCKET_URL`  | Socket.io server URL     | `http://localhost:4000`    |

---

## Running Tests

```bash
cd server
npm test
```

Tests cover:
- Auth middleware (valid, expired, missing, invalid tokens)
- RBAC middleware (each role against restricted routes)
- Task move endpoint (order recalculation)
- Socket event emission after task:moved

---

## Deployment

### Vercel (Frontend)

1. Import `apps/web` into Vercel
2. Set root directory to `apps/web`
3. Add env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SOCKET_URL`
4. Add `VERCEL_TOKEN` to GitHub secrets

### Render (Backend)

1. Create a new Web Service pointing to the `server/` directory
2. Build command: `npm install && npm run build`
3. Start command: `node dist/index.js`
4. Add all server env vars in Render dashboard
5. Copy the deploy hook URL → add as `RENDER_DEPLOY_HOOK` GitHub secret

### GitHub Actions Secrets Required

| Secret                | Description                        |
|-----------------------|------------------------------------|
| `VERCEL_TOKEN`        | Vercel personal access token       |
| `RENDER_DEPLOY_HOOK`  | Render deploy hook URL             |

CI runs on every push. Deployment runs on push to `main` only.

---

## RBAC Summary

| Action                    | ADMIN | MEMBER | VIEWER |
|---------------------------|-------|--------|--------|
| View board                | ✅    | ✅     | ✅     |
| Create/edit/move tasks    | ✅    | ✅     | ❌     |
| Delete tasks              | ✅    | ✅     | ❌     |
| Add/rename columns        | ✅    | ✅     | ❌     |
| Delete columns/board      | ✅    | ❌     | ❌     |
| Manage members            | ✅    | ❌     | ❌     |
