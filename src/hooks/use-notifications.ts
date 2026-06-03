'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Notification } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useSettingsStore } from '@/lib/store/settings';

interface UseNotificationsResult {
  notifications: Notification[];
  unread: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const FALLBACK_POLL_MS = 30_000;

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: String(row.id),
    type: (row.type as Notification['type']) || 'system',
    platform: (row.platform as Notification['platform']) || 'agent',
    title: (row.title as string) || '',
    message: (row.message as string) || '',
    read: !!row.read,
    createdAt: relativeTime(row.created_at as string),
    link: row.link as string | undefined,
  };
}

function relativeTime(iso: string): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} hour${Math.floor(diff / 3_600_000) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / 86_400_000)} day${Math.floor(diff / 86_400_000) > 1 ? 's' : ''} ago`;
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useSettingsStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const data = await res.json();
        setNotifications((data.notifications || []).map(rowToNotification));
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    void refresh();

    const supabase = createClient();
    const channel = supabase
      .channel(`notif-rt-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { void refresh(); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => { void refresh(); }
      )
      .subscribe();

    const es = new EventSource('/api/notifications/stream');
    eventSourceRef.current = es;
    es.addEventListener('notification', () => { void refresh(); });
    es.onerror = () => { /* let it fall back to polling */ };

    fallbackRef.current = setInterval(() => { void refresh(); }, FALLBACK_POLL_MS);

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
      es.close();
      if (fallbackRef.current) clearInterval(fallbackRef.current);
    };
  }, [user, refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch('/api/notifications/mark-all-read', { method: 'POST' });
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  return { notifications, unread, loading, markRead, markAllRead, dismiss, refresh };
}
