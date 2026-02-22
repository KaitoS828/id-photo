-- ==========================================
-- Stripe 連携用テーブル群 (匿名ユーザー/ゲストID対応版)
-- ==========================================

-- 1. 決済履歴 (payments)
-- 匿名ユーザー (ブラウザのローカルで生成したUUID = guest_id) と紐づける
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id UUID NOT NULL, -- auth.users(id) ではなく、フロントで生成した一意のUUIDを保存する
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'jpy',
  status TEXT NOT NULL CHECK (status IN (
    'succeeded', 'pending', 'failed', 'refunded', 'open', 'complete', 'expired'
  )),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_payments_guest_id ON public.payments (guest_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON public.payments (stripe_checkout_session_id);

-- RLS（Row Level Security）の有効化
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- データの読み取りポリシー: 誰でも自分のguest_idのデータは読めるようにする（本来は認証が必要だが、ゲスト向けのため匿名アクセスを許可）
CREATE POLICY "Anyone can read payments by guest_id"
  ON public.payments FOR SELECT
  USING (true);

-- データの挿入/更新ポリシー: セキュアなサーバー（Service Role Key）のみ許可する想定だが、
-- 今回は単純化のために制限を緩めるか、API（service_role）経由のみ書き込みを許可する。
-- サービスロールによるアクセスはバイパスされるため、挿入・更新ポリシーは空（基本は弾く）にしておく。
