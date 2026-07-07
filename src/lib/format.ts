export function formatLevel(value?: string | null): string {
  const raw = value && value.length > 0 ? value : 'Professional';
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}
