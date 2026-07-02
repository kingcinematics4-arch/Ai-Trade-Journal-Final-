import React from 'react';

interface CommunityHeaderProps {
  title: string;
  subtitle: string;
}

export default function CommunityHeader({ title, subtitle }: CommunityHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
    </div>
  );
}
