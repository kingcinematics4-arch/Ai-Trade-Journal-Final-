import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  const action =
    actionLabel &&
    (actionHref ? (
      <Link href={actionHref} className="btn-primary text-sm py-2 px-4 inline-flex">
        {actionLabel}
      </Link>
    ) : onAction ? (
      <button type="button" onClick={onAction} className="btn-primary text-sm py-2 px-4">
        {actionLabel}
      </button>
    ) : null);

  return (
    <div
      className={['flex flex-col items-center justify-center text-center py-10 px-4', className]
        .filter(Boolean)
        .join(' ')}
    >
      {icon ? <div className="mb-3 text-muted-foreground">{icon}</div> : null}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
