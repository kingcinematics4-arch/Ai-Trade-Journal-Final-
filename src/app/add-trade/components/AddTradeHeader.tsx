import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

export default function AddTradeHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-foreground">Log New Trade</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Record every detail for accurate AI analysis and performance tracking
          </p>
        </div>
      </div>
    </div>
  );
}
