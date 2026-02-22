-- ==========================================
-- payments テーブルにゲストフロー対応を追加
-- ==========================================
-- 現在のスキーマでは user_id (auth.users 参照) が NOT NULL ですが、
-- このアプリはログイン不要のゲストフローで動作するため、
-- guest_id (TEXT) カラムを追加し、user_id を nullable にします。

-- 1. user_id の NOT NULL 制約を外す
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;

-- 2. user_id の REFERENCES 制約を外す（ゲストは auth.users に存在しないため）
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;

-- 3. guest_id カラムを追加
ALTER TABLE payments ADD COLUMN IF NOT EXISTS guest_id TEXT;

-- 4. guest_id にインデックスを追加（ステータス確認クエリの高速化）

CREATE INDEX IF NOT EXISTS idx_payments_guest_id ON payments (guest_id);
