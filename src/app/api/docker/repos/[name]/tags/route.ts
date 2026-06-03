import { NextRequest, NextResponse } from 'next/server';
import { getRepoTags } from '@/lib/api/docker';

export async function GET(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const [namespace, repo] = name.split('/');
  if (!namespace || !repo) return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  try {
    const tags = await getRepoTags(token, namespace, repo);
    return NextResponse.json(tags);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
