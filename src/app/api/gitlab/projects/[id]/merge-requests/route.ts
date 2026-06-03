import { NextRequest, NextResponse } from 'next/server';
import { listMRs } from '@/lib/api/gitlab';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const baseUrl = req.nextUrl.searchParams.get('baseUrl') || 'https://gitlab.com';
  const state = req.nextUrl.searchParams.get('state') || 'opened';
  try {
    const mrs = await listMRs(token, Number(id), state as 'opened' | 'all', baseUrl);
    return NextResponse.json(mrs);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
