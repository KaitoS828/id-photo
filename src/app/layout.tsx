import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ID Photo Converter — AI証明写真変換',
  description: 'AIを使って一瞬で証明写真を作成。背景の自動変更、サイズ調整に対応。パスポート・履歴書・マイナンバーカード対応。',
  keywords: ['証明写真', 'ID写真', 'パスポート写真', '履歴書写真', 'AI', '背景除去'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={`${inter.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
