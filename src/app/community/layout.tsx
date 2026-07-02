import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community',
  description: 'Connect with experienced traders and the AI Trade Journal community.',
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
