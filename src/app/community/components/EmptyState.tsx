import React from 'react';
import Link from 'next/link';
import { Users, UserPlus, Inbox } from 'lucide-react';

interface EmptyStateProps {
  type: 'network' | 'invitations';
}

export default function EmptyState({ type }: EmptyStateProps) {
  const config = {
    network: {
      icon: <Users size={48} className="text-primary/50" />,
      title: 'No Connections Yet',
      description: 'Your network is empty. Connect with other traders to see them here.',
      actionText: 'Discover Traders',
      actionHref: '/community/discover',
      actionIcon: <UserPlus size={16} />
    },
    invitations: {
      icon: <Inbox size={48} className="text-primary/50" />,
      title: 'No Pending Invitations',
      description: 'You do not have any pending connection requests right now.',
      actionText: 'Find Connections',
      actionHref: '/community/discover',
      actionIcon: <UserPlus size={16} />
    }
  };

  const current = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="h-24 w-24 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mb-6 shadow-inner">
        {current.icon}
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight mb-2">{current.title}</h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 text-sm leading-relaxed">
        {current.description}
      </p>
      <Link 
        href={current.actionHref}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
      >
        {current.actionIcon}
        {current.actionText}
      </Link>
    </div>
  );
}
