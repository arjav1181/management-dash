import type { MetadataRoute } from 'next';
import { APP_NAME } from '@/lib/utils/constants';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://mgmt-dash.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/huggingface`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/vercel`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/github`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/docker`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${BASE}/gitlab`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${BASE}/netlify`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${BASE}/search`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/agent`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/notifications`, lastModified: now, changeFrequency: 'always', priority: 0.4 },
  ];
}

export const metadata = { title: APP_NAME };
