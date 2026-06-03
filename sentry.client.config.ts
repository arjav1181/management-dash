const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export async function register() {
  if (typeof window === 'undefined') return;
  if (!SENTRY_DSN) return;

  const Sentry = await import('@sentry/browser' as string).catch(() => null);
  if (!Sentry) return;
  (Sentry as { init: (opts: Record<string, unknown>) => void }).init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
