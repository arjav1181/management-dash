import { NextRequest, NextResponse } from 'next/server';
import { listSites } from '@/lib/api/netlify';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  try {
    const sites = await listSites(token);
    return NextResponse.json(sites);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
