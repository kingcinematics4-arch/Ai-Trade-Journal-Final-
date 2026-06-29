import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge Tailwind CSS classes safely.
 * Handles conditional classes via clsx and merges conflicting Tailwind utilities via tailwind-merge.
 * Essential for components that accept a className prop.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
