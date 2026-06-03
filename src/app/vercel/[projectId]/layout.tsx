import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/utils/constants';

export async function generateMetadata({ params }: { params: Promise<{ projectId: string }> }): Promise<Metadata> {
  const { projectId } = await params;
  return {
    title: `Project ${projectId} — Vercel`,
    description: `Deployments and status for Vercel project ${projectId}.`,
    openGraph: { title: `Vercel project ${projectId}`, siteName: APP_NAME },
  };
}

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return children;
}
