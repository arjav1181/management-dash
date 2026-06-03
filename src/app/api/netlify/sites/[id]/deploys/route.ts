import { NextRequest, NextResponse } from 'next/server';
import { listDeploys } from '@/lib/api/netlify';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const deploys = await listDeploys(token, id);
    return NextResponse.json(deploys);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
