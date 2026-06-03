'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME } from '@/lib/utils/constants';
import { Eye, EyeOff, Terminal } from 'lucide-react';
import { useToastStore } from '@/components/ui/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { register, login, settings } = useSettingsStore();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegister) {
      if (settings.email) {
        addToast('error', 'Account already exists. Please log in.');
        return;
      }
      const ok = await register(email, password);
      if (ok) {
        addToast('success', 'Account created successfully');
        router.push('/');
      } else {
        addToast('error', 'Registration failed');
      }
    } else {
      if (login(email, password)) {
        addToast('success', 'Logged in successfully');
        router.push('/');
      } else if (settings.email === email) {
        addToast('error', 'Incorrect password');
      } else if (!settings.email) {
        setIsRegister(true);
        addToast('info', 'No account found. Create one?');
      } else {
        addToast('error', 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-emerald/5 pointer-events-none" />
      <Card className="w-full max-w-sm relative animate-fadeIn">
        <CardContent>
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <Terminal size={24} className="text-accent" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">{APP_NAME}</h1>
            <p className="text-sm text-text-muted mt-1">
              {isRegister ? 'Create your account' : 'Sign in to your dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button type="submit" className="w-full">
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-accent hover:text-accent-hover transition-colors"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
