import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key'
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const guestId = searchParams.get('guestId');

  if (!guestId) {
    return NextResponse.json({ isPremium: false });
  }

  try {
    // 成功した決済があるかチェック
    const { data: payments, error } = await supabaseAdmin
      .from('payments')
      .select('id')
      .eq('guest_id', guestId)
      .eq('status', 'succeeded')
      .limit(1);

    if (error) {
      console.error('[API] fetch payments error:', error);
      return NextResponse.json({ isPremium: false }, { status: 500 });
    }

    const isPremium = payments && payments.length > 0;
    return NextResponse.json({ isPremium });
  } catch (error) {
    console.error('[API] user status check failed:', error);
    return NextResponse.json({ isPremium: false }, { status: 500 });
  }
}
