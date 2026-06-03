import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/utils/constants';

export async function generateMetadata({ params }: { params: Promise<{ owner: string; repo: string }> }): Promise<Metadata> {
  const { owner, repo } = await params;
  return {
    title: `${owner}/${repo} — GitHub`,
    description: `Commits, issues, PRs, and CI status for ${owner}/${repo}.`,
    openGraph: { title: `${owner}/${repo}`, siteName: APP_NAME },
  };
}

export default function RepoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
