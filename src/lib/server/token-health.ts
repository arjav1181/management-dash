import type { SupabaseLike } from './settings';
import { log } from './log';

export type { SupabaseLike };

export type TokenPlatform = 'hf' | 'vercel' | 'github' | 'docker' | 'gitlab' | 'netlify';

export async function recordTokenSuccess(supabase: SupabaseLike, userId: string, platform: TokenPlatform): Promise<void> {
  const { error } = await supabase.from('token_health').upsert({
    user_id: userId,
    platform,
    last_validated_at: new Date().toISOString(),
    last_error: null,
    last_error_at: null,
  });
  if (error) log.warn('token_health.upsert_failed', { error: error.message, platform });
}

export async function recordTokenError(supabase: SupabaseLike, userId: string, platform: TokenPlatform, error: string): Promise<void> {
  const { error: dbErr } = await supabase.from('token_health').upsert({
    user_id: userId,
    platform,
    last_validated_at: new Date().toISOString(),
    last_error: error,
    last_error_at: new Date().toISOString(),
  });
  if (dbErr) log.warn('token_health.upsert_failed', { error: dbErr.message, platform });

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'system',
    platform,
    title: `${platform} token may be invalid`,
    message: error,
    link: '/settings',
  });
}

export async function getTokenHealth(supabase: SupabaseLike, userId: string): Promise<Array<{ platform: TokenPlatform; last_validated_at: string | null; last_error: string | null; last_error_at: string | null }>> {
  const { data } = await supabase
    .from('token_health')
    .select('platform, last_validated_at, last_error, last_error_at')
    .eq('user_id', userId);
  return (data || []) as Array<{ platform: TokenPlatform; last_validated_at: string | null; last_error: string | null; last_error_at: string | null }>;
}
