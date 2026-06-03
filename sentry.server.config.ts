const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!SENTRY_DSN) return;

  const Sentry = await import('@sentry/node' as string).catch(() => null);
  if (!Sentry) return;
  (Sentry as { init: (opts: Record<string, unknown>) => void }).init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.05,
    sendDefaultPii: false,
    beforeSend(event: { user?: Record<string, unknown> }) {
      if (event.user) {
        delete event.user.ip_address;
        delete event.user.email;
      }
      return event;
    },
  });
}
