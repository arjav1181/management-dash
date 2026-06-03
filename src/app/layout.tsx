import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ToastContainer } from '@/components/ui/toast';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Management Dash',
  description: 'Unified infrastructure control center for HF Spaces, Vercel, and GitHub',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg-primary text-text-primary">
        <DashboardLayout>
          {children}
        </DashboardLayout>
        <ToastContainer />
      </body>
    </html>
  );
}
