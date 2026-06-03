import { NextRequest, NextResponse } from 'next/server';
import { listRepos } from '@/lib/api/docker';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  try {
    const repos = await listRepos(token);
    return NextResponse.json(repos);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
