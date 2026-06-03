type Level = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = (process.env.LOG_LEVEL as Level) || 'info';
const minLevel = LEVELS[threshold] ?? LEVELS.info;

function emit(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < minLevel) return;
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') process.stderr.write(line + '\n');
  else process.stdout.write(line + '\n');
}

export const log = {
  debug: (msg: string, meta?: Record<string, unknown>) => emit('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => emit('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => emit('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit('error', msg, meta),
};

export function withRequest(requestId: string, route: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) => log.debug(msg, { requestId, route, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) => log.info(msg, { requestId, route, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) => log.warn(msg, { requestId, route, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) => log.error(msg, { requestId, route, ...meta }),
  };
}

export function newRequestId(): string {
  return Math.random().toString(36).slice(2, 12);
}
