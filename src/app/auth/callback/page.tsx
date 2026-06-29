'use client';

import React, { useEffect, useMemo, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const handled = useRef(false);
  const [statusMessage, setStatusMessage] = useState('Finalizing security authorization...');

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    let cancelled = false;

    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const errorCode = searchParams.get('error');
        const errorDesc = searchParams.get('error_description');

        // OAuth error from provider
        if (errorCode || errorDesc) {
          console.error('[auth] OAuth error:', { errorCode, errorDesc });
          router.replace('/login');
          return;
        }

        if (code) {
          setStatusMessage('Exchanging credentials...');

          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[auth] exchange error:', error);
            router.replace('/login');
            return;
          }
        }

        setStatusMessage('Checking session...');

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[auth] session error:', sessionError);
          router.replace('/login');
          return;
        }

        const session = data?.session;

        if (!session) {
          setTimeout(async () => {
            if (cancelled) return;

            const { data: retry } = await supabase.auth.getSession();

            if (retry?.session) {
              router.replace('/dashboard');
            } else {
              router.replace('/login');
            }
          }, 1500);

          return;
        }

        router.replace('/dashboard');
      } catch (err) {
        console.error('[auth] callback crash:', err);
        router.replace('/login');
      }
    }

    handleCallback();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, supabase]);

  return (
    <div className="flex flex-col items-center gap-4 text-center z-10 max-w-sm">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>

      <h2 className="text-xl font-bold">Authenticating...</h2>

      <p className="text-xs text-slate-400">{statusMessage}</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#02040a] text-white p-6">
      <Suspense fallback={<Loader2 className="animate-spin" />}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}
