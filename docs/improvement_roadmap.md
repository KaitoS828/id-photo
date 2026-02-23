# 🚀 ID Photo Studio — 80点→100点 改善ロードマップ

> 現状の80点は「基本機能が動作する」状態。100点は「本番運用に耐え、ユーザーが安心して利用でき、開発者が保守しやすい」状態。

---

## 🔴 Priority 1: セキュリティ（+8点）

### 1-1. PromoCode のサーバーサイド検証
**現状**: フロントエンドに `'20230322'` がハードコード → DevToolsで誰でも発見可能
```
対策: /api/verify-promo エンドポイントを新設し、サーバー側で検証
     → フロントにはコードそのものを持たない
```

### 1-2. Webhook の冪等性（重複防止）
**現状**: Stripeリトライで同一決済が複数回DBに挿入される
```
対策: stripe_checkout_session_id に UNIQUE制約を追加
     → INSERT を UPSERT に変更
```

### 1-3. API Rate Limiting
**現状**: /api/checkout, /api/convert にレート制限なし → 悪意ある連打が可能
```
対策: next-rate-limit や Vercel Edge Middleware で制限
     例: 1分あたり5回まで
```

### 1-4. 環境変数のバリデーション
**現状**: 未設定時にダミーキーでフォールバック → 本番で気づかず動作
```
対策: サーバー起動時に必須変数の存在チェック → 未設定なら即エラー
```

---

## 🟡 Priority 2: コード品質・保守性（+5点）

### 2-1. page.tsx の分割（908行 → 各200行以下）
```
src/
├── app/page.tsx              → レイアウト + composition のみ
├── components/
│   ├── HeroSection.tsx       → LP部分
│   ├── PhotoEditor.tsx       → エディタ・プレビュー
│   ├── PaymentCTA.tsx        → 購入ボタン・プロモコード
│   ├── SheetPreview.tsx      → 台紙プレビュー
│   └── SettingsPanel.tsx     → 補正オプション
├── hooks/
│   ├── useGuestAuth.ts       → guestId管理
│   ├── usePaymentState.ts    → 決済状態管理(Zustand)
│   └── useImageConverter.ts  → 変換ロジック
└── stores/
    └── paymentStore.ts       → Zustand store
```

### 2-2. デッドコード削除
- `user-status/route.ts` — 現在呼び出し元なし（一回きりモデル移行済み）
- `unlock/route.ts` — 未使用のアンロックAPI

### 2-3. エラーハンドリング統一
- `img.onload` にタイムアウト + `onerror` ハンドラ追加
- API レスポンスの型定義を統一（Result型パターン）

---

## 🟢 Priority 3: UX改善（+4点）

### 3-1. 決済完了後のフィードバック強化
```
・成功時: 🎉 トースト通知「決済完了！透かしなし画像をダウンロードできます」
・失敗時: エラートースト + リトライボタン
・ダウンロード完了時: 「ダウンロード完了。コンビニ印刷の手順はこちら」
```

### 3-2. ダウンロード完了後のガイダンス
```
・「セブンイレブンでの印刷手順」のモーダルまたはアコーディオン
・QRコードで印刷アプリへ直接誘導
```

### 3-3. モバイル最適化
- カメラ直接起動（`capture="environment"` 属性）
- タッチ操作対応のスライダー

---

## 🔵 Priority 4: 本番運用の堅牢性（+3点）

### 4-1. エラー監視
```
Sentry 導入 → ランタイムエラーの自動通知
Next.js instrumentation hook で簡単統合可能
```

### 4-2. テスト追加
```
・ユニットテスト: checkout/route.ts, webhook/route.ts の入出力検証
・E2Eテスト: Playwright で決済フロー自動テスト（Stripe Test Mode）
```

### 4-3. CI/CD
```
GitHub Actions:
  - PR時: lint + type-check + unit-test
  - main push時: Vercel自動デプロイ
```

### 4-4. 環境変数の外出し
```
・STRIPE_PRICE_ID → .env.localへ移動
・PromoCode → DB管理（将来的に複数コード対応）
```

---

## 📊 改善効果サマリー

| カテゴリ | 現状 | 目標 | 加点 |
|---------|------|------|------|
| セキュリティ | PromoCode露出、重複挿入リスク | サーバー検証、冪等性、Rate Limit | **+8** |
| コード品質 | 908行モノリシック、デッドコード | 分割、Zustand、フック分離 | **+5** |
| UX | 決済後フィードバック不足 | トースト、印刷ガイド、モバイル最適化 | **+4** |
| 運用堅牢性 | テスト・監視なし | Sentry、テスト、CI/CD | **+3** |
| **合計** | **80点** | | **+20 = 100点** |

---

## 🎯 推奨実装順序

```
Week 1: セキュリティ修正（1-1, 1-2, 1-4）
Week 2: コード分割（2-1, 2-2）
Week 3: UX改善（3-1, 3-2）
Week 4: 運用基盤（4-1, 4-2, 4-3）
```

> **最も投資対効果が高いのは「1-1 PromoCodeのサーバーサイド化」と「2-1 page.tsxの分割」。**
> この2つだけで体感的に90点近くまで到達できます。
