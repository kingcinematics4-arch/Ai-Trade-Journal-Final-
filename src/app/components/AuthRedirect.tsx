'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/LoadingSkeleton';

export default function AuthRedirect() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthRedirect] Checking state...', { isLoading, hasUser: !!user });
    if (!isLoading && user) {
      console.log('[AuthRedirect] Triggering redirect to /dashboard');
      router.refresh();
      router.replace('/dashboard');
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <p className="text-sm text-muted-foreground">Checking session...</p>
        </div>
      </div>
    );
  }

  return null;
}
