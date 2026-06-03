export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { registerWssProxy } = await import('./server/wss-proxy');
  registerWssProxy();
}
