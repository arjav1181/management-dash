import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DocumentTitle } from '@/components/layout/document-title';
import { ToastContainer } from '@/components/ui/toast';
import { APP_NAME, APP_TAGLINE } from '@/lib/utils/constants';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — ${APP_TAGLINE}`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-icon.svg',
  },
  openGraph: {
    title: APP_NAME,
    description: APP_TAGLINE,
    siteName: APP_NAME,
    type: 'website',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_TAGLINE,
    images: ['/og-image.svg'],
  },
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
          <DocumentTitle />
          {children}
        </DashboardLayout>
        <ToastContainer />
      </body>
    </html>
  );
}
