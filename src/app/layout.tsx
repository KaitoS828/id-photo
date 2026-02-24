import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '700', '800', '900'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.id-photomake.com';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563EB',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: '証明写真をスマホで作成｜AI証明写真メーカー ID Photo Studio【¥300で高画質】',
    template: '%s | ID Photo Studio',
  },
  description:
    '証明写真をスマホで簡単作成。AIが背景透過＆スーツ着用を自動処理し、コンビニ印刷用L判台紙を無料生成。履歴書・パスポート・マイナンバーカード・運転免許証に対応。写真機の半額以下¥300、撮り直し無制限、5分で完成。就活生・転職者に選ばれています。',
  keywords: [
    '証明写真', '証明写真 アプリ', '証明写真 スマホ', '証明写真 安い',
    '証明写真 コンビニ', '証明写真 自宅', '証明写真 作成',
    '履歴書 写真', '履歴書 写真 サイズ', '履歴書 証明写真 アプリ',
    'パスポート写真', 'パスポート 証明写真 スマホ',
    'マイナンバーカード 写真', 'マイナンバー 証明写真',
    '運転免許証 写真', '免許更新 写真',
    'AI 証明写真', '証明写真 背景透過', '証明写真 スーツ',
    '証明写真 300円', 'ID写真 アプリ', '就活 証明写真',
    '証明写真 印刷 コンビニ', 'L判 証明写真',
    '証明写真 撮り直し 無制限', '証明写真 即日',
    '証明写真 オンライン', '証明写真 データ ダウンロード',
    '就活 証明写真 安い', '転職 証明写真 アプリ',
  ],
  applicationName: 'ID Photo Studio',
  authors: [{ name: 'ID Photo Studio' }],
  creator: 'ID Photo Studio',
  publisher: 'ID Photo Studio',
  category: 'photography',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: 'ID Photo Studio',
    title: '証明写真をスマホで¥300作成｜AI証明写真メーカー ID Photo Studio',
    description:
      'スマホの写真をアップロードするだけ。AIが背景透過＆スーツ着用を自動処理。履歴書・パスポート・マイナンバーカード対応。撮り直し無制限、5分で完成。',
    images: [
      {
        url: '/images/lp/TOPセクション.png',
        width: 1200,
        height: 630,
        alt: 'ID Photo Studio — AI証明写真メーカー スマホで証明写真を作成',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '証明写真をスマホで¥300作成｜ID Photo Studio',
    description:
      'AIが背景透過＆スーツ着用を自動処理。撮り直し無制限、5分で完成。就活・免許更新・パスポート申請に。',
    images: ['/images/lp/TOPセクション.png'],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'ja-JP': SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'google': 'notranslate',
  },
  verification: {
    google: 'Monk2CVZWkbdxFJbWDeI2s36yx19KML6LtBNj4rtoRc',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ID Photo Studio",
    "url": SITE_URL,
    "description": "スマホの写真をアップロードするだけ。AIが背景透過＆スーツ着用を自動処理。履歴書・パスポート・マイナンバーカード対応。撮り直し無制限、5分で完成。",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "300",
      "priceCurrency": "JPY"
    }
  };

  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* DNS Prefetch & Preconnect for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} 
        />
      </head>
      <body className={`${inter.variable} ${notoSansJP.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
