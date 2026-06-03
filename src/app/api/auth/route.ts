import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { email, password, action } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  if (action === 'register') {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Check email to confirm' });
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({ success: true, user: { id: user!.id, email: user!.email } });
}
