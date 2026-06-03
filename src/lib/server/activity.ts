import type { SupabaseLike } from './settings';
import { newRequestId, log } from './log';

export type { SupabaseLike };

export type ActivityPlatform = 'huggingface' | 'vercel' | 'github' | 'docker' | 'gitlab' | 'netlify' | 'agent';

export async function logActivity(
  supabase: SupabaseLike,
  userId: string,
  platform: ActivityPlatform,
  type: string,
  message: string,
  link?: string
): Promise<void> {
  const { error } = await supabase.from('activity').insert({
    user_id: userId,
    platform,
    type,
    message,
    link: link ?? null,
  });
  if (error) {
    log.warn('activity.log_failed', { requestId: newRequestId(), error: error.message, platform, type });
  }
}

export async function pushNotification(
  supabase: SupabaseLike,
  userId: string,
  data: {
    type: 'deploy_success' | 'deploy_fail' | 'build_complete' | 'space_error' | 'pr_merged' | 'issue_assigned' | 'pipeline_fail' | 'system';
    platform: ActivityPlatform;
    title: string;
    message: string;
    link?: string;
  }
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type: data.type,
    platform: data.platform,
    title: data.title,
    message: data.message,
    link: data.link ?? null,
  });
  if (error) {
    log.warn('notification.push_failed', { requestId: newRequestId(), error: error.message, type: data.type });
  }
}
