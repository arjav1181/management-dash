import { NextRequest, NextResponse } from 'next/server';
import { getSpaceLogs } from '@/lib/api/huggingface';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const logs = await getSpaceLogs(token, id);
    return NextResponse.json(logs);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
