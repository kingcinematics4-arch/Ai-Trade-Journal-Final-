import { createClient } from '@/lib/supabase';

/**
 * Check if a table exists in the public schema.
 * Uses information_schema which is readable by authenticated users.
 * Returns false gracefully if the table doesn't exist or if there's an error.
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .maybeSingle();

    if (error) {
      // If information_schema itself is not accessible, fall back to error detection
      console.warn(`[tableExists] Could not check information_schema for "${tableName}":`, error.message);
      return false;
    }

    return !!data;
  } catch (err) {
    console.warn(`[tableExists] Error checking for table "${tableName}":`, err);
    return false;
  }
}

/**
 * Check if a PostgREST error indicates the table doesn't exist.
 * These errors typically have code '42P01' or messages containing
 * "Could not find the table" or "relation does not exist".
 */
export function isTableNotFoundError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;

  const msg = (error.message ?? '').toLowerCase();
  const code = error.code ?? '';

  return (
    code === '42P01' ||
    msg.includes('could not find the table') ||
    msg.includes('relation') && msg.includes('does not exist') ||
    msg.includes('does not exist') && msg.includes('table')
  );
}

/**
 * Friendly error message for table not found scenario.
 */
export function getTableNotFoundFriendlyError(tableName: string): string {
  return (
    `The "${tableName}" table is not set up in your Supabase database. ` +
    `Please run the migration SQL file at src/lib/sql/profile_likes_migration.sql ` +
    `in your Supabase SQL Editor to create it.`
  );
}