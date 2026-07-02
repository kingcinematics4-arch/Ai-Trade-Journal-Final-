import React from 'react';
import Sidebar from '@/components/Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden w-full relative">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
