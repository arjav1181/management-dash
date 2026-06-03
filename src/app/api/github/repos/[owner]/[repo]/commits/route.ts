import { NextRequest, NextResponse } from 'next/server';
import { getCommits } from '@/lib/api/github';

export async function GET(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const commits = await getCommits(token, owner, repo);
    return NextResponse.json(commits);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
