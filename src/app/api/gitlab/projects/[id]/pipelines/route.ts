import { NextRequest, NextResponse } from 'next/server';
import { listPipelines } from '@/lib/api/gitlab';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  const baseUrl = req.nextUrl.searchParams.get('baseUrl') || 'https://gitlab.com';
  try {
    const pipelines = await listPipelines(token, Number(id), baseUrl);
    return NextResponse.json(pipelines);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
