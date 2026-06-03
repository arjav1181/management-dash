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
3. Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4. Run the SQL migration in **Supabase SQL Editor**:

```sql
-- Copy and paste from supabase/migrations/001_user_settings.sql
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
- **Search** — Cross-platform search across all connected services
- **Notifications** — Real-time alerts for deploys, builds, and failures
- **HF Spaces** — List, status, restart/stop/sleep, logs, file editor, terminal
- **Vercel** — Projects, deployments, trigger deploy, deployment logs
- **GitHub** — Repos, commits, issues (create), PRs (merge), CI status
- **Docker Hub** — List repositories, view tags and pull counts
- **GitLab** — Projects, pipelines, merge requests
- **Netlify** — Sites, deploys, deploy status
- **AI Agent** — Chat interface with configurable LLM provider
- **Terminal** — SSH/WSS terminal access to HF Spaces

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Set the environment variables in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
