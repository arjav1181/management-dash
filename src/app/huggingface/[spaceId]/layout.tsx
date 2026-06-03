import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/utils/constants';

export async function generateMetadata({ params }: { params: Promise<{ spaceId: string }> }): Promise<Metadata> {
  const { spaceId } = await params;
  const decoded = decodeURIComponent(spaceId);
  return {
    title: `${decoded} — HF Space`,
    description: `Manage, monitor, and connect to ${decoded} on Hugging Face Spaces via Bridge.`,
    openGraph: { title: `${decoded} — Bridge`, description: `HF Space: ${decoded}`, siteName: APP_NAME },
  };
}

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
