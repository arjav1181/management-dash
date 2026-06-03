# Bridge — Unified Infrastructure Control Center

Monitor and manage HuggingFace Spaces, Vercel, GitHub, Docker Hub, GitLab, and Netlify from a single, unified dashboard.

## Tech Stack

- **Framework:** Next.js 16.2.7 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Auth & DB:** Supabase (SSR)
- **State:** Zustand
- **Charts:** Recharts
- **Terminal:** xterm.js + xterm-addon-fit
- **Editor:** Monaco Editor
- **AI Agent:** Multi-provider (Groq, Gemini, Anthropic, OpenAI, OpenRouter, Cerebras)

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/arjav1181/management-dash.git
cd management-dash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from **Project Settings → API**
3. Copy `.env.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BRIDGE_TOKEN_KEY=<openssl rand -base64 32>
```

4. Run the SQL migrations in **Supabase SQL Editor** (in order):

```bash
# In order:
supabase/migrations/001_user_settings.sql
supabase/migrations/002_notifications_activity_wss.sql
```

### 3. Run the dev server

```bash
npm run dev
# Opens at http://localhost:3000
```

### 4. Add your API tokens

After logging in, go to **Settings** and add tokens for the integrations you use:

| Service | Token Type | How to Get |
|---------|-----------|------------|
| Hugging Face | User Access Token | hf.co/settings/tokens |
| Vercel | Personal Access Token | vercel.com/account/tokens |
| GitHub | Personal Access Token (classic) | github.com/settings/tokens (repo, read:org) |
| Docker Hub | Personal Access Token | hub.docker.com/settings/security |
| GitLab | Personal Access Token | gitlab.com/-/user_settings/personal_access_tokens |
| Netlify | Personal Access Token | app.netlify.com/user/applications/personal |

## Features

- **Dashboard** — Overview with stat cards, health score, deployment charts, and activity feed
- **Search** — Server-side cross-platform search across all connected services (`/api/search`)
- **Notifications** — Supabase Realtime + SSE + 30s polling fallback with unread badge in header
- **HF Spaces** — List, status, restart/stop/sleep, logs, file editor, terminal
- **Vercel** — Projects, deployments, trigger deploy, deployment logs
- **GitHub** — Repos, commits, issues (create), PRs (merge), CI status
- **Docker Hub** — List repositories, view tags and pull counts
- **GitLab** — Projects, pipelines, merge requests
- **Netlify** — Sites, deploys, deploy status
- **AI Agent** — Multi-provider tool-calling agent (Groq, Gemini, Anthropic, OpenAI, OpenRouter, Cerebras, Custom)
- **Terminal** — xterm.js + WSS agent (auto-patched into space) with JWT auth

## Security

- All third-party tokens are **AES-256-GCM** encrypted server-side using `BRIDGE_TOKEN_KEY` before storage
- Tokens never leave the server; the client only sees boolean `tokens.{hf, vercel, ...}` flags
- Per-user/route rate limiting (token bucket) — destructive endpoints are stricter
- HTTP security headers: HSTS, X-Frame-Options DENY, CSP, Referrer-Policy, Permissions-Policy
- CORS is allowlist-based; no `Access-Control-Allow-Origin: *`
- Auth required on all API routes via `requireAuth()` middleware

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run ci         # lint + typecheck + test + build
```

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Set the environment variables in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `BRIDGE_TOKEN_KEY` (generate with `openssl rand -base64 32`)
- `ALLOWED_ORIGINS` (comma-separated)
- `LOG_LEVEL` (`debug` | `info` | `warn` | `error`, default `info`)
