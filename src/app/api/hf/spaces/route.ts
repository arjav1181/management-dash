import { NextRequest, NextResponse } from 'next/server';
import { listSpaces } from '@/lib/api/huggingface';

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  try {
    const spaces = await listSpaces(token);
    return NextResponse.json(spaces);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch spaces' }, { status: 500 });
  }
}
