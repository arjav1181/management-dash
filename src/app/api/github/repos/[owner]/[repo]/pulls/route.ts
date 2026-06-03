import { NextRequest, NextResponse } from 'next/server';
import { listPRs } from '@/lib/api/github';

export async function GET(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const prs = await listPRs(token, owner, repo);
    return NextResponse.json(prs);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
