# Contributing to Bridge

Thanks for your interest in contributing. Bridge is a personal infrastructure project; contributions are welcome but review may take time.

## Setup

1. Fork the repo and clone
2. Install: `npm install`
3. Set up Supabase:
   - Create a project at supabase.com
   - Copy `.env.example` to `.env.local` and fill in
   - Run migrations in order from `supabase/migrations/` in the Supabase SQL editor
4. Start: `npm run dev`

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm test           # vitest
npm run ci         # lint + typecheck + test + build
```

## Code conventions

- TypeScript strict mode
- `'use client'` only when needed (interactivity, hooks)
- API routes under `src/app/api/` follow REST conventions
- Server-only utilities under `src/lib/server/`
- Tailwind v4 with `bg-bg-*` / `text-text-*` semantic tokens (no hardcoded colors)
- All new API routes use `requireAuth()` and `rateLimitForRoute()`
- All third-party tokens are encrypted via `encryptToken()` before storage

## Adding a new tool to the agent

1. Add a definition in `src/lib/agent/tools.ts` (name, description, parameters, execute)
2. Mark destructive tools with `requiresConfirmation: true`
3. Use `toolRequiresToken()` to detect missing platform tokens
4. Add a test in `src/lib/agent/tools.test.ts`

## Commit messages

Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

## Pull requests

- Keep PRs small and focused
- Include tests for new logic
- Ensure `npm run ci` passes locally
- Reference any related issues

## Security

Do not commit `.env.local`, secrets, or `MEMORY.txt`. If you find a security issue, please open a private issue or email the maintainer directly.
