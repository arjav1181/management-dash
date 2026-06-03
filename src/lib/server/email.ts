import type { SupabaseLike } from './settings';
import { log } from './log';

export type { SupabaseLike };

export interface EmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const RESEND_API = 'https://api.resend.com/emails';
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.EMAIL_FROM || 'Bridge <noreply@mgmt-dash.app>';

export async function sendEmail(payload: EmailPayload): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!RESEND_KEY) {
    log.warn('email.disabled', { to: payload.to, subject: payload.subject });
    return { ok: true, id: 'skipped' };
  }
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
      body: JSON.stringify({ from: FROM, to: [payload.to], subject: payload.subject, text: payload.text, html: payload.html }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: t.slice(0, 300) };
    }
    const data = await res.json();
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}

export async function notifyUser(supabase: SupabaseLike, userId: string, kind: 'deploy_fail' | 'space_error' | 'pipeline_fail' | 'token_invalid', payload: { title: string; message: string; link?: string }): Promise<void> {
  await supabase.from('notifications').insert({
    user_id: userId,
    type: kind,
    platform: 'agent',
    title: payload.title,
    message: payload.message,
    link: payload.link || null,
  });
}
