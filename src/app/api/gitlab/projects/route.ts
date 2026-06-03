import { NextRequest, NextResponse } from 'next/server';
import { listProjects } from '@/lib/api/gitlab';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const baseUrl = req.nextUrl.searchParams.get('baseUrl') || 'https://gitlab.com';
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  try {
    const projects = await listProjects(token, baseUrl);
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
