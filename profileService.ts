import { createClient } from '@/lib/supabase';

/**
 * Updates the user's email address.
 * Supabase will send a confirmation email to both the old and new addresses by default.
 */
export async function updateEmail(newEmail: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
}

/**
 * Sends a password reset email to the user.
 */
export async function sendPasswordReset(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/profile/settings`,
  });
  if (error) throw error;
}
