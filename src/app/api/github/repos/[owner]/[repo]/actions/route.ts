import { NextRequest, NextResponse } from 'next/server';
import { listActionRuns } from '@/lib/api/github';

export async function GET(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const runs = await listActionRuns(token, owner, repo);
    return NextResponse.json(runs);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
