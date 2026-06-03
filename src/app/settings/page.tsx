import { redirect } from 'next/navigation';

/**
 * /settings redirects to /profile (settings are embedded in the profile page).
 */
export default function SettingsPage() {
  redirect('/profile');
}
