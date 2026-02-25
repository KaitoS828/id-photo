import { NextRequest, NextResponse } from 'next/server';

// ユーザー指定のPayment Link URL
const PAYMENT_LINK_URL = 'https://buy.stripe.com/aFa28rfV87aY3EOcas43S00';

export async function POST(request: NextRequest) {
  try {
    const { guestId } = await request.json();

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 });
    }

    // Checkout Session生成ではなく、Payment Linkにclient_reference_idを付与してリダイレクトさせる
    const url = new URL(PAYMENT_LINK_URL);
    if (guestId) {
      url.searchParams.set('client_reference_id', guestId);
    }

    return NextResponse.json({ url: url.toString() });
  } catch (error: unknown) {
    console.error('[API] POST /api/checkout error:', error);
    return NextResponse.json(
      { error: '決済URLの生成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
