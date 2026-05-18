import '@/styles/tailwind.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import Providers from '@/components/Providers';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'AITradeJournal — Log Trades, Track Performance, Get AI Insights',
  description:
    'AI-powered trade journal for retail traders. Log every trade, analyze patterns, track win rate, and get rule-based coaching to improve discipline.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} dark`}>
      <body className={dmSans.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
