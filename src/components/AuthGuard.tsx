'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';

type AuthStatus = 'loading' | 'authenticated';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const supabase = createClient();

    const handleSession = (hasSession: boolean) => {
      if (!hasSession) {
        setStatus('loading');
        router.replace('/login');
        return;
      }
      setStatus('authenticated');
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(!!session);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex h-screen items-center justify-center bg-background" role="status">
        <Loader2 size={32} className="animate-spin text-primary" aria-label="Checking session" />
      </div>
    );
  }

  return <>{children}</>;
}
