'use client';
import { Toaster } from 'sonner';

export default function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      theme="dark"
      richColors={false}
      closeButton={false}
      expand={false}
      visibleToasts={5}
      toastOptions={{
        style: {
          background: 'var(--card)',
          border: '1px solid var(--border)',
          color: 'var(--foreground)',
          fontFamily: 'var(--font-sans)',
        },
        className: 'z-[99999]',
      }}
      // Ensure custom/realtime toasts sit above modals/panels
      style={{ zIndex: 99999 }}
    />
  );
}
