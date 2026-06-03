import { NextRequest, NextResponse } from 'next/server';
import { listProjects } from '@/lib/api/vercel';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  try {
    const projects = await listProjects(token);
    return NextResponse.json(projects);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
