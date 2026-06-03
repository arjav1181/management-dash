'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/store/settings';
import { User, Mail, Calendar, Shield, LogOut, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useSettingsStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fadeIn">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent/30">
          <User size={36} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-text-primary">{user.email?.split('@')[0] || 'User'}</h1>
        <p className="text-sm text-text-muted">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User size={16} className="text-accent" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/50">
            <Mail size={16} className="text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Email</p>
              <p className="text-sm text-text-primary">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/50">
            <Shield size={16} className="text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Auth Provider</p>
              <p className="text-sm text-text-primary">Supabase (email/password)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-tertiary/50">
            <Calendar size={16} className="text-text-muted" />
            <div>
              <p className="text-xs text-text-muted">Signed in</p>
              <p className="text-sm text-text-primary">Session active</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell size={16} className="text-accent" /> Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-text-muted">Notification and theme preferences coming soon.</p>
        </CardContent>
      </Card>

      <Button variant="danger" className="w-full" onClick={handleLogout}>
        <LogOut size={16} /> Sign Out
      </Button>
    </div>
  );
}
