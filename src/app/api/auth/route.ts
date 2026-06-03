import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    return NextResponse.json({ success: true, email });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
