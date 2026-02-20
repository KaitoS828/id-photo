# ID Photo Studio

AI を使って証明写真をかんたんに作成できる Web アプリケーションです。  
写真をアップロードするだけで、背景変更・スーツ着用・サイズ調整を自動で行います。

![ID Photo Studio](https://img.shields.io/badge/Next.js-16-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Gemini](https://img.shields.io/badge/Gemini_3_Pro-Nano_Banana_Pro-purple)

## 機能

- 📷 **写真アップロード** — ドラッグ&ドロップ / クリックで選択（JPG, PNG, WebP 対応）
- 🎨 **背景色変更** — 白・青・グレーの3色から選択
- 👔 **スーツ着用** — AI が自動でビジネススーツに変換
- 📐 **サイズプリセット** — パスポート / 履歴書 / マイナンバーカード / 運転免許証 / ビザ
- 🖨️ **台紙ダウンロード** — L判サイズの切り取りガイド付き印刷用台紙を生成
- ⬇️ **画像ダウンロード** — 変換後の証明写真をそのまま PNG で保存
- 📱 **レスポンシブ** — PC / スマホ対応

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript |
| AI モデル | Nano Banana Pro (Gemini 3 Pro Image Preview) |
| AI SDK | @google/genai |
| スタイリング | Vanilla CSS |
| フォント | Inter (Google Fonts) |

## セットアップ

### 前提条件

- Node.js 18 以上
- Google AI Studio の API キー（[こちらで取得](https://aistudio.google.com/app/apikey)）

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/KaitoS828/id-photo.git
cd id-photo

# 依存パッケージをインストール
npm install

# 環境変数を設定
cp .env.example .env.local
# .env.local を編集し GEMINI_API_KEY を設定
```

### 起動

```bash
npm run dev
```

`http://localhost:3000` でアクセスできます。

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `GEMINI_API_KEY` | Google AI Studio の API キー |

## 使い方

1. 写真をアップロード
2. 背景色・写真サイズを選択
3. 「証明写真を作成」をクリック
4. 完成した写真をダウンロード
   - **画像をダウンロード** → 証明写真単体
   - **台紙をダウンロード** → L判印刷用（切り取りガイド付き）

## プロジェクト構成

```
src/
├── app/
│   ├── api/convert/route.ts   # Gemini API で証明写真に変換
│   ├── globals.css             # グローバルスタイル
│   ├── layout.tsx              # ルートレイアウト
│   └── page.tsx                # メインページ UI
├── types.ts                    # 型定義・プリセット定数
└── utils/
    └── generateSheet.ts        # 台紙生成（Canvas API）
```

## ライセンス

MIT
