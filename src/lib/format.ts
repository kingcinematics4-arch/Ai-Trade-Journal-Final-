export function formatLevel(value?: string | null): string {
  const raw = value && value.length > 0 ? value : 'Professional';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

export function truncateBio(value?: string | null, max = 120): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) + '...' : value;
}
