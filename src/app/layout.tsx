import '@/styles/tailwind.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import {
  DM_Sans,
  Noto_Sans_SC,
  Noto_Sans_Devanagari,
  Noto_Sans_Arabic,
  Noto_Sans_Bengali,
} from 'next/font/google';
import Providers from '@/components/Providers';

// Load fonts for all supported languages
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['cyrillic', 'latin', 'latin-ext', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-devanagari',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-arabic',
  display: 'swap',
});

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto-sans-bengali',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export const metadata: Metadata = {
  title: {
    default: 'AITradeJournal — Log Trades, Track Performance, Get AI Insights',
    template: '%s | AITradeJournal',
  },
  description:
    'AI-powered trade journal for retail traders. Log every trade, analyze patterns, track win rate, and get rule-based coaching to improve discipline.',
  keywords: [
    'trade journal',
    'trading diary',
    'AI trading insights',
    'trade tracking',
    'performance analysis',
    'win rate tracker',
    'trading discipline',
    'retail trading',
    'trade logging',
    'pattern recognition',
  ],
  authors: [{ name: 'AITradeJournal' }],
  creator: 'AITradeJournal',
  publisher: 'AITradeJournal',
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
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aitradejournal.com',
    siteName: 'AITradeJournal',
    title: 'AITradeJournal — Log Trades, Track Performance, Get AI Insights',
    description:
      'AI-powered trade journal for retail traders. Log every trade, analyze patterns, track win rate, and get rule-based coaching to improve discipline.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AITradeJournal - AI-Powered Trade Journal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AITradeJournal — Log Trades, Track Performance, Get AI Insights',
    description:
      'AI-powered trade journal for retail traders. Log every trade, analyze patterns, track win rate, and get rule-based coaching to improve discipline.',
    images: ['/og-image.png'],
    creator: '@aitradejournal',
  },
  alternates: {
    canonical: 'https://aitradejournal.com',
    languages: {
      en: 'https://aitradejournal.com',
      'zh-CN': 'https://aitradejournal.com?lang=zh-CN',
      hi: 'https://aitradejournal.com?lang=hi',
      es: 'https://aitradejournal.com?lang=es',
      ar: 'https://aitradejournal.com?lang=ar',
      fr: 'https://aitradejournal.com?lang=fr',
      bn: 'https://aitradejournal.com?lang=bn',
      pt: 'https://aitradejournal.com?lang=pt',
      id: 'https://aitradejournal.com?lang=id',
      ur: 'https://aitradejournal.com?lang=ur',
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${notoSansSC.variable} ${notoSansDevanagari.variable} ${notoSansArabic.variable} ${notoSansBengali.variable} dark`}
      style={{ colorScheme: 'dark' }}
    >
      <body
        className={`${dmSans.className} antialiased min-h-screen bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
