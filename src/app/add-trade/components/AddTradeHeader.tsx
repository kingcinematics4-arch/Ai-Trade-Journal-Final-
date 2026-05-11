import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function AddTradeHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Log New Trade</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Record every detail for accurate AI analysis and performance tracking
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard"
          className="btn-secondary flex items-center gap-2 text-sm py-2"
        >
          <BookOpen size={14} />
          Trade History
        </Link>
      </div>
    </div>
  );
}