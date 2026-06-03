'use client';

import React, { useState } from 'react';
import { AlertTriangle, LogOut, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutEverywhere, deleteAccount } from '@/services/profileService';

export default function DangerZone() {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

  const handleLogoutEverywhere = async () => {
    setSigningOut(true);
    try {
      await signOutEverywhere();
      toast.success('Signed out from all devices.');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to sign out');
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== CONFIRM_PHRASE) {
      toast.error(`Please type "${CONFIRM_PHRASE}" to confirm.`);
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted. Goodbye!');
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-red-500/10 flex items-center gap-2">
        <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
        <h2 className="text-sm font-bold text-red-400">Danger Zone</h2>
      </div>

      <div className="px-6 divide-y divide-red-500/[0.08]">
        {/* Logout everywhere */}
        <div className="flex items-start justify-between gap-4 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <LogOut size={16} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Log Out Everywhere</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Revoke all active sessions across all devices. You'll be logged out here too.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="logout-everywhere-btn"
            onClick={handleLogoutEverywhere}
            disabled={signingOut}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/10 transition-all disabled:opacity-50"
          >
            {signingOut ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
            {signingOut ? 'Signing out…' : 'Log Out All'}
          </button>
        </div>

        {/* Delete account */}
        <div className="flex items-start justify-between gap-4 py-4">
          <div className="flex items-start gap-3 min-w-0">
            <Trash2 size={16} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Permanently remove your account and all associated data. This cannot be undone.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="delete-account-btn"
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={() => { setDeleteConfirmOpen(false); setConfirmText(''); }}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md bg-slate-950 border border-red-500/30 rounded-2xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Confirm account deletion"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 size={18} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Delete Account</h3>
                  <p className="text-xs text-muted-foreground">This action is permanent and irreversible.</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                All your trades, analytics, goals, and profile data will be permanently deleted.
                Your account for <span className="text-foreground font-semibold">{user?.email}</span> cannot be recovered.
              </p>

              <div className="space-y-2 mb-5">
                <label className="text-xs font-semibold text-muted-foreground">
                  Type <span className="text-red-400 font-bold font-mono">{CONFIRM_PHRASE}</span> to confirm:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm font-mono text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
                  id="delete-confirm-input"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setDeleteConfirmOpen(false); setConfirmText(''); }}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.05] border border-white/[0.07] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting || confirmText !== CONFIRM_PHRASE}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-40"
                  id="confirm-delete-btn"
                >
                  {deleting && <Loader2 size={13} className="animate-spin" />}
                  {deleting ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
