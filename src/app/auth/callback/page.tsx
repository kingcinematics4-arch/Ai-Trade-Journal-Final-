'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMessage, setStatusMessage] = useState('Finalizing security authorization...');
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    async function handleCallback() {
      const code = searchParams.get('code');
      const errorCode = searchParams.get('error');
      const errorDesc = searchParams.get('error_description');

      if (errorCode || errorDesc) {
        console.error('[auth] OAuth error received in callback:', {
          errorCode,
          errorDesc,
        });

        toast.error(errorDesc || 'Authentication request was declined.');

        router.replace('/login');
        return;
      }

      try {
        if (code) {
          setStatusMessage('Exchanging security credentials...');

          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            throw exchangeError;
          }
        }

        setStatusMessage('Verifying active session...');

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          console.log('Session not ready yet. Waiting 2 seconds...');

          setTimeout(async () => {
            const {
              data: { session: retrySession },
            } = await supabase.auth.getSession();

            if (retrySession) {
              router.replace('/dashboard');
            } else {
              router.replace('/login');
            }
          }, 2000);

          return;
        }

        if (active) {
          toast.success('Sign in successful!');
          router.replace('/dashboard');
        }
      } catch (err: any) {
        console.error('[auth] OAuth callback verification failed:', err);

        toast.error(
          err.message || 'Authentication failed. Returning to login.'
        );

        router.replace('/login');
      }
    }

    void handleCallback();

    return () => {
      active = false;
    };
  }, [searchParams, supabase, router]);

  return (
    <div className="flex flex-col items-center gap-4 text-center z-10 max-w-sm">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-lg animate-pulse">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>

      <h2 className="text-xl font-bold tracking-tight">
        Authenticating with Google
      </h2>

      <p className="text-xs text-slate-400 font-medium leading-relaxed">
        {statusMessage}
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#02040a] via-[#050814] to-[#02040a] text-white p-6 relative">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[80px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-4 text-center z-10 max-w-sm">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <p className="text-xs text-slate-400">
              Loading callback...
            </p>
          </div>
        }
      >
        <AuthCallbackContent />
      </Suspense>
    </div>
  );
}