import type { SupabaseLike } from './settings';
import { log } from './log';

export type { SupabaseLike };

export interface AuditEvent {
  userId: string;
  event: string;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}

export async function audit(supabase: SupabaseLike, ev: AuditEvent): Promise<void> {
  const { error } = await supabase.from('audit_log').insert({
    user_id: ev.userId,
    event: ev.event,
    ip: ev.ip || null,
    user_agent: ev.userAgent || null,
    meta: ev.meta || null,
  });
  if (error) {
    log.warn('audit.write_failed', { error: error.message, event: ev.event });
  }
}
