# Changelog

All notable changes to Bridge will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-06-03

### Added
- AES-256-GCM token encryption with `BRIDGE_TOKEN_KEY`
- AI agent with 17 tools across HF, Vercel, GitHub; multi-provider (OpenAI, Anthropic, Gemini, Groq, OpenRouter, Cerebras, custom)
- SSE streaming for agent chat
- WSS terminal proxy (Node `instrumentation.ts` sidecar)
- Cross-platform search (server-side)
- Notifications: Supabase Realtime + SSE + 30s polling fallback
- Tool execution activity logging
- Audit log table
- Token health tracking
- Webhook handlers with HMAC verification
- Email notifications (Resend)
- i18n (English + Hindi)
- Theme switcher (light/dark)
- PWA manifest
- OpenAPI spec at `/api/docs`
- robots.txt + sitemap.xml
- CSP with report endpoint
- Sentry init (optional via env)
- Per-route metadata, loading.tsx, error.tsx
- Vitest tests (crypto, jwt, settings, rate-limit, llm, tools, huggingface)
- GitHub Actions CI
- Docker + docker-compose

### Security
- All tokens encrypted server-side
- Server-side `requireAuth` on all API routes
- Per-user/route rate limiting (token bucket)
- Security headers: HSTS, X-Frame-Options DENY, CSP, Permissions-Policy
- CORS allowlist

## [0.1.0] - Initial release
- Basic dashboard, Hugging Face integration, Vercel, GitHub, Docker, GitLab, Netlify
- Supabase auth
- xterm.js terminal
