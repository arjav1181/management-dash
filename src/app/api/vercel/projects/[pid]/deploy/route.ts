import { NextRequest, NextResponse } from 'next/server';
import { triggerDeploy } from '@/lib/api/vercel';

export async function POST(req: NextRequest, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const ok = await triggerDeploy(token, pid);
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
