import { NextRequest, NextResponse } from 'next/server';
import { patchSpaceWithWssAgent } from '@/lib/wss-agent/patcher';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const result = await patchSpaceWithWssAgent(token, id);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, message: 'Patch failed' }, { status: 500 });
  }
}
