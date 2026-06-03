'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/lib/store/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME, APP_TAGLINE } from '@/lib/utils/constants';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { useToastStore } from '@/components/ui/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useSettingsStore();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegister) {
      const ok = await register(email, password);
      if (ok) {
        addToast('success', 'Account created. Check email to confirm.');
        setIsRegister(false);
      } else {
        addToast('error', 'Registration failed. Email may already exist.');
      }
    } else {
      const ok = await login(email, password);
      if (ok) {
        router.push('/');
      } else {
        addToast('error', 'Invalid email or password');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-accent-lighter/5 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulseSoft" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-lighter/5 rounded-full blur-3xl animate-pulseSoft" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-accent-subtle/5 rounded-full blur-3xl animate-pulseSoft" style={{ animationDelay: '2s' }} />

      <Card className="w-full max-w-sm relative animate-fadeIn shadow-xl shadow-accent/5 border-accent/10">
        <CardContent>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent-hover shadow-lg shadow-accent/30 flex items-center justify-center mx-auto mb-4 animate-float">
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 22L10 14L14 18L18 10L22 16L26 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="26" cy="8" r="2" fill="white"/>
                <circle cx="6" cy="22" r="2" fill="white"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">{APP_NAME}</h1>
            <p className="text-sm text-text-muted mt-1.5">{APP_TAGLINE}</p>
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
            <p className="text-sm text-text-secondary mt-4">
              {isRegister ? 'Create your account' : 'Sign in to your dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={16} className="absolute right-3 top-[38px] text-text-muted" />
            </div>

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
                className="absolute right-3 top-[38px] text-text-muted hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button type="submit" className="w-full h-11 text-base" loading={loading}>
              <KeyRound size={16} />
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-text-muted hover:text-accent transition-colors"
            >
              {isRegister ? (
                <>Already have an account? <span className="text-accent">Sign in</span></>
              ) : (
                <>Don&apos;t have an account? <span className="text-accent">Create one</span></>
              )}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
