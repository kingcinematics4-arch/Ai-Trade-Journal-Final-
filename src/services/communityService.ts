import { createClient } from '@/lib/supabase';
import type { DbConnection, Connection, PublicTraderProfile, PaginatedTraders } from '@/types/community';
import { mapDbConnection } from '@/types/community';

const PROFILES_PER_PAGE = 12;

// ─── Trade Stats Helpers ─────────────────────────────────────────────────────

interface TradeStats {
  trades_logged: number;
  win_rate: number | null;
  total_pnl: number | null;
  avg_rr: number | null;
}

/**
 * Fetch aggregated trade statistics for a set of user IDs.
 * Returns a map of userId -> TradeStats.
 */
async function fetchTradeStatsForUsers(userIds: string[]): Promise<Map<string, TradeStats>> {
  if (userIds.length === 0) return new Map();

  const supabase = createClient();

  const { data, error } = await supabase
    .from('trades')
    .select('user_id, pnl_amount, trade_status, rr_ratio') // This was already correct, but verifying.
    .in('user_id', userIds);

  if (error) {
    console.error('[communityService] fetchTradeStatsForUsers error:', error.message);
    return new Map();
  }

  const statsMap = new Map<string, TradeStats>();

  // Group trades by user_id
  const grouped = new Map<string, { pnl: number[]; statuses: string[]; rr: number[] }>();
  for (const trade of data ?? []) {
    if (!grouped.has(trade.user_id)) {
      grouped.set(trade.user_id, { pnl: [], statuses: [], rr: [] });
    }
    const group = grouped.get(trade.user_id)!;
    if (trade.pnl_amount != null) group.pnl.push(Number(trade.pnl_amount)); // Corrected from pnl
    if (trade.trade_status) group.statuses.push(trade.trade_status); // Corrected from status
    if (trade.rr_ratio != null) group.rr.push(Number(trade.rr_ratio));
  }

  for (const [userId, group] of grouped) {
    const tradesLogged = group.pnl.length; // Use PNL length as a more reliable trade count
    const wins = group.statuses.filter((s) => s.toLowerCase() === 'win').length;
    const winRate = tradesLogged > 0 ? (wins / tradesLogged) * 100 : null;
    const totalPnl = group.pnl.reduce((sum, v) => sum + v, 0);
    const avgRr = group.rr.length > 0
      ? group.rr.reduce((sum, v) => sum + v, 0) / group.rr.length
      : null;

    statsMap.set(userId, {
      trades_logged: tradesLogged,
      win_rate: winRate,
      total_pnl: totalPnl,
      avg_rr: avgRr,
    });
  }

  return statsMap;
}

/**
 * Fetch aggregated trade statistics for a single user ID.
 */
async function fetchTradeStatsForUser(userId: string): Promise<TradeStats> {
  const map = await fetchTradeStatsForUsers([userId]);
  return map.get(userId) ?? { trades_logged: 0, win_rate: null, total_pnl: null, avg_rr: null };
}

// ─── Public Profile Queries ─────────────────────────────────────────────────

/**
 * Fetch public profiles with pagination.
 * Only returns users with public_profile = true.
 * Excludes the currently logged-in user.
 * Uses only standard Supabase queries (no RPC).
 */
export async function getPublicTraders(
  page: number = 1,
  searchQuery?: string,
  sortBy: string = 'createdAt'
): Promise<PaginatedTraders> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // ── Step 1: Build the base query ──────────────────────────────────────
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .eq('public_profile', true);

  // Exclude current user
  if (currentUserId) {
    query = query.neq('id', currentUserId);
  }

  // ── Step 2: Apply search filter ───────────────────────────────────────
  const search = searchQuery?.trim();
  if (search && search.length > 0) {
    query = query.or(
      `username.ilike.%${search}%,full_name.ilike.%${search}%,country.ilike.%${search}%,trading_style.ilike.%${search}%`
    );
  }

  // ── Step 3: Apply pagination and sorting ──────────────────────────────
  // For stat-based sorts, we'll sort in TypeScript after merging stats.
  const isStatSort = sortBy === 'mostActive' || sortBy === 'highestWinRate';

  const from = (page - 1) * PROFILES_PER_PAGE;
  const to = from + PROFILES_PER_PAGE - 1;
  query = query.range(from, to);

  if (!isStatSort) {
    if (sortBy === 'alphabetical') {
      query = query.order('full_name', { ascending: true, nullsFirst: false });
    } else {
      // Default: 'createdAt' or any other value
      query = query.order('created_at', { ascending: false, nullsFirst: false });
    }
  }

  // ── Step 4: Execute query and fetch trade stats ───────────────────────
  const { data: profiles, error, count } = await query;

  if (error) {
    console.error('[communityService] getPublicTraders data error:', error.message);
    throw new Error(error.message);
  }

  const userIds = (profiles ?? []).map((p) => p.id);
  const statsMap = await fetchTradeStatsForUsers(userIds);

  // ── Step 5: Merge stats and perform client-side sort if needed ────────
  let traders: PublicTraderProfile[] = (profiles ?? []).map((p) =>
    mapToPublicTrader(p, statsMap.get(p.id))
  );

  // ── Step 8: Sort by stat-based fields in TypeScript ───────────────────
  if (sortBy === 'mostActive') {
    traders.sort((a, b) => b.tradesLogged - a.tradesLogged);
  } else if (sortBy === 'highestWinRate') {
    traders.sort((a, b) => {
      const aWR = a.winRate ?? -1;
      const bWR = b.winRate ?? -1;
      return bWR - aWR;
    });
  }

  const totalCount = count ?? 0;
  const hasMore = page * PROFILES_PER_PAGE < totalCount;

  return {
    traders,
    total: totalCount,
    hasMore,
  };
}

/**
 * Fetch a single public profile by user ID.
 * Returns null if the profile is private or doesn't exist.
 */
export async function getPublicProfileById(userId: string): Promise<PublicTraderProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === '406') return null;
    console.error('[communityService] getPublicProfileById error:', error.message);
    throw new Error(error.message);
  }

  // If profile is not public, return null (security: never expose private profiles)
  if (!data.public_profile) return null;

  // Fetch trade stats separately
  const stats = await fetchTradeStatsForUser(userId);

  return mapToPublicTrader(data, stats);
}

/**
 * Fetch a single public profile by username.
 * Returns null if the profile is private or doesn't exist.
 */
export async function getPublicProfileByUsername(username: string): Promise<PublicTraderProfile | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === '406') return null;
    console.error('[communityService] getPublicProfileByUsername error:', error.message);
    throw new Error(error.message);
  }

  // Security: never expose private profiles
  if (!data.public_profile) return null;

  // Fetch trade stats separately
  const stats = await fetchTradeStatsForUser(data.id);

  return mapToPublicTrader(data, stats);
}

// ─── Connection Requests ────────────────────────────────────────────────────

/**
 * Send a connection request from the current user to another user.
 */
export async function sendConnectionRequest(recipientId: string): Promise<Connection> {
  console.warn('[communityService] sendConnectionRequest: connections table not yet implemented.');
  throw new Error('Connections feature is not yet available');
}

/**
 * Get the connection status between the current user and another user.
 * Returns null if no connection exists.
 */
export async function getConnectionStatus(targetUserId: string): Promise<Connection | null> {
  return null;
}

/**
 * Accept a pending connection request.
 */
export async function acceptConnectionRequest(connectionId: string): Promise<Connection> {
  console.warn('[communityService] acceptConnectionRequest: connections table not yet implemented.');
  throw new Error('Connections feature is not yet available');
}

/**
 * Decline a pending connection request.
 */
export async function declineConnectionRequest(connectionId: string): Promise<Connection> {
  console.warn('[communityService] declineConnectionRequest: connections table not yet implemented.');
  throw new Error('Connections feature is not yet available');
}

/**
 * Get all connections for the current user.
 */
export async function getUserConnections(): Promise<Connection[]> {
  return [];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Map a DbProfile to a PublicTraderProfile.
 * Stats are provided separately from the trades table aggregation.
 */
function mapToPublicTrader(profile: any, stats?: TradeStats): PublicTraderProfile {
  return {
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    country: profile.country,
    tradingStyle: profile.trading_style ?? null,
    markets: profile.markets ?? null,
    experience: profile.experience ?? null,
    tradesLogged: stats?.trades_logged ?? 0,
    winRate: stats?.win_rate ?? null,
    totalPnl: stats?.total_pnl ?? null,
    avgRr: stats?.avg_rr ?? null,
    showStats: profile.show_stats ?? true,
    publicProfile: profile.public_profile,
    createdAt: profile.created_at,
  };
}