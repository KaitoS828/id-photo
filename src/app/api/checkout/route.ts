import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Stripeダッシュボードで登録済みのPrice ID
const STRIPE_PRICE_ID = 'price_1T3bUPILEcT30IEP0nk0699l';

export async function POST(request: NextRequest) {
  try {
    const { guestId } = await request.json();

    if (!guestId) {
      return NextResponse.json({ error: 'Guest ID is required' }, { status: 400 });
    }

    // Checkout Session 作成（Stripeダッシュボードで登録済みの商品・価格を使用）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.nextUrl.origin}/?session_id={CHECKOUT_SESSION_ID}&success=true#editor`,
      cancel_url: `${request.nextUrl.origin}/?canceled=true#editor`,
      metadata: { guest_id: guestId },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('[API] POST /api/checkout error:', error);
    return NextResponse.json(
      { error: '決済セッションの作成に失敗しました', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
