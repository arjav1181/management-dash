import { NextRequest, NextResponse } from 'next/server';
import { listIssues, createIssue } from '@/lib/api/github';

export async function GET(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const state = req.nextUrl.searchParams.get('state') || 'open';
  try {
    const issues = await listIssues(token, owner, repo, state as 'open' | 'closed' | 'all');
    return NextResponse.json(issues);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ owner: string; repo: string }> }) {
  const { owner, repo } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const body = await req.json();
    const ok = await createIssue(token, owner, repo, body.title, body.body, body.labels);
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
