import { NextRequest, NextResponse } from 'next/server';
import { listDeployments } from '@/lib/api/vercel';

export async function GET(req: NextRequest, { params }: { params: Promise<{ pid: string }> }) {
  const { pid } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  try {
    const deployments = await listDeployments(token, pid);
    return NextResponse.json(deployments);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
