import React from 'react';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  activePath?: string;
}

export default function AppLayout({ children, activePath }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden w-full relative">
      <Sidebar activePath={activePath} />
      <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden scrollbar-thin pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
