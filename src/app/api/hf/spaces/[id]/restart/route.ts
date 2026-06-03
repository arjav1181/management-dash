import { NextRequest, NextResponse } from 'next/server';
import { restartSpace } from '@/lib/api/huggingface';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const ok = await restartSpace(token, id);
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
