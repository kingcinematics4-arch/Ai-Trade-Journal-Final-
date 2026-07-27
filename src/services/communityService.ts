import { createClient } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase/supabase-admin';
import type { PublicTraderProfile, PaginatedTraders } from '@/types/community';
import { computeTradeAnalytics } from '@/lib/trades/analytics';
import type { DbTrade, TradeAnalytics } from '@/lib/trades/types';

const PROFILES_PER_PAGE = 12;

// ─── Trade Stats Helpers ─────────────────────────────────────────────────────

/**
 * Fetch full analytics for multiple users using the service role client.
 * Uses the shared computeTradeAnalytics engine so all pages show identical stats.
 */
async function fetchTradeStatsForUsers(userIds: string[]): Promise<Map<string, TradeAnalytics>> {
  if (userIds.length === 0) return new Map();

  let tradesData: any[] = [];
  let fetched = false;

  // 1. Try service role client first (bypasses RLS if valid SUPABASE_SERVICE_ROLE_KEY is set)
  try {
    const supabaseAdmin = createServiceClient();
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.from('trades').select('*').in('user_id', userIds);
      if (!error && data && data.length > 0) {
        tradesData = data;
        fetched = true;
        console.log('RAW QUERY', tradesData);
      }
    }
  } catch (err) {
    console.warn('[communityService] serviceClient attempt failed:', err);
  }

  // 2. If running on server side, try server client with session cookies (allows RLS access for logged-in user)
  if (!fetched && typeof window === 'undefined') {
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/supabase-server');
      const serverSupabase = await createServerSupabaseClient();
      const { data, error } = await serverSupabase.from('trades').select('*').in('user_id', userIds);
      if (!error && data && data.length > 0) {
        tradesData = data;
        fetched = true;
        console.log('RAW QUERY', tradesData);
      }
    } catch (serverErr) {
      console.warn('[communityService] serverSupabaseClient attempt failed:', serverErr);
    }
  }

  // 3. Fallback to standard client
  if (!fetched) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('trades').select('*').in('user_id', userIds);
      if (!error && data) {
        tradesData = data;
        console.log('RAW QUERY', tradesData);
      }
    } catch (stdErr) {
      console.error('[communityService] standard client query error:', stdErr);
    }
  }

  const tradesByUser = new Map<string, Record<string, unknown>[]>();
  for (const trade of tradesData) {
    const uid = trade.user_id as string;
    if (!tradesByUser.has(uid)) {
      tradesByUser.set(uid, []);
    }
    tradesByUser.get(uid)!.push(trade);
  }

  const statsMap = new Map<string, TradeAnalytics>();
  for (const [userId, rows] of tradesByUser) {
    const analytics = computeTradeAnalytics(rows as DbTrade[]);
    console.log('[communityService] fetchTradeStatsForUsers computed analytics:', {
      userId,
      totalTrades: analytics.totalTrades,
      winRate: analytics.winRate,
      winCount: analytics.winCount,
      lossCount: analytics.lossCount,
    });
    statsMap.set(userId, analytics);
  }

  return statsMap;
}

/**
 * Fetch like counts for multiple profile IDs using the service role client.
 */
async function fetchLikeCountsForUsers(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('profile_likes')
      .select('profile_id')
      .in('profile_id', userIds);

    if (error) {
      console.error('[communityService] fetchLikeCountsForUsers error:', error.message);
      return new Map();
    }

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const pid = row.profile_id as string;
      counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }

    return counts;
  } catch (err) {
    console.error('[communityService] fetchLikeCountsForUsers unexpected error:', err);
    return new Map();
  }
}

/**
 * Fetch all trades for a single user ID using the service role client.
 * Bypasses RLS to read another user's trades for public profile display.
 */
async function fetchTradesForUser(userId: string): Promise<DbTrade[]> {
  let tradesData: any[] = [];
  let fetched = false;

  // 1. Try service role client first
  try {
    const supabaseAdmin = createServiceClient();
    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('trade_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        tradesData = data;
        fetched = true;
        console.log("RAW RESPONSE", data);
      }
    }
  } catch (err) {
    console.warn('[communityService] fetchTradesForUser serviceClient error:', err);
  }

  // 2. If running on server side, try server client with session cookies
  if (!fetched && typeof window === 'undefined') {
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase/supabase-server');
      const serverSupabase = await createServerSupabaseClient();
      const { data, error } = await serverSupabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('trade_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        tradesData = data;
        fetched = true;
        console.log("RAW RESPONSE", data);
      }
    } catch (serverErr) {
      console.warn('[communityService] fetchTradesForUser serverSupabase error:', serverErr);
    }
  }

  // 3. Fallback to standard client
  if (!fetched) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', userId)
        .order('trade_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (!error && data) {
        tradesData = data;
        console.log("RAW RESPONSE", data);
      }
    } catch (stdErr) {
      console.error('[communityService] fetchTradesForUser standard client error:', stdErr);
    }
  }

  console.log("TRADES", tradesData);
  return tradesData as DbTrade[];
}

/**
 * Compute full analytics for a user by fetching their trades and running
 * the shared analytics engine. Returns the same TradeAnalytics shape used
 * by the dashboard and trade history.
 */
async function computeFullAnalyticsForUser(userId: string): Promise<TradeAnalytics> {
  try {
    const trades = await fetchTradesForUser(userId);
    const stats = computeTradeAnalytics(trades);
    console.log("PROFILE ID", userId);
    console.log("USER ID", userId);
    console.log("PROFILE STATS", stats);
    return stats;
  } catch (err) {
    console.error('[communityService] computeFullAnalyticsForUser error:', err);
    return {
      isEmpty: true,
      totalTrades: 0,
      totalPnl: 0,
      winCount: 0,
      lossCount: 0,
      breakevenCount: 0,
      winRate: 0,
      avgRr: 0,
      currentStreak: { type: 'none', count: 0 },
      bestTrade: null,
      worstTrade: null,
      pnlTrend: [],
      marketDistribution: [],
    };
  }
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id;

  // ── Step 1: Build the base query ──────────────────────────────────────
  let query = supabase.from('profiles').select('*', { count: 'exact' }).eq('public_profile', true);

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

  console.log('===== RAW PROFILE FROM SUPABASE =====');
  console.table(profiles);
  console.log('[communityService] getPublicTraders profiles count:', profiles?.length ?? 0);
  console.log('[communityService] getPublicTraders query error:', error);
  console.log('[communityService] getPublicTraders currentUserId:', currentUserId);
  if (profiles && profiles.length > 0) {
    console.log('[communityService] getPublicTraders first profile id:', profiles[0].id);
  }

  if (error) {
    console.error('[communityService] getPublicTraders data error:', error.message);
    throw new Error(error.message);
  }

  const userIds = (profiles ?? []).map((p) => p.id);
  console.log('[communityService] getPublicTraders userIds:', userIds);
  const statsMap = await fetchTradeStatsForUsers(userIds);
  console.log('[communityService] getPublicTraders statsMap keys:', Array.from(statsMap.keys()));
  console.log(
    '[communityService] getPublicTraders statsMap sample:',
    statsMap.get(userIds[0] ?? '')
  );
  const likeCountsMap = await fetchLikeCountsForUsers(userIds);
  console.log(
    '[communityService] getPublicTraders likeCountsMap:',
    Object.fromEntries(likeCountsMap)
  );

  // ── Step 5: Merge stats and perform client-side sort if needed ────────
  console.log('[communityService] getPublicTraders mapping traders...');
  const traders: PublicTraderProfile[] = (profiles ?? []).map((p) => {
    const analytics = statsMap.get(p.id);
    const likeCount = likeCountsMap.get(p.id) ?? 0;
    console.log('[communityService] getPublicTraders mapped profile:', {
      profileId: p.id,
      username: p.username,
      hasAnalytics: !!analytics,
      totalTrades: analytics?.totalTrades ?? 0,
      winRate: analytics?.winRate ?? null,
      likeCount,
    });
    return mapToPublicTrader(p, analytics, likeCount);
  });

  console.log('===== MAPPED TRADERS WITH STATS =====');
  console.table(traders);

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

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) {
    if (error.code === 'PGRST116' || error.code === '406') return null;
    console.error('[communityService] getPublicProfileById error:', error.message);
    throw new Error(error.message);
  }

  // If profile is not public, return null (security: never expose private profiles)
  if (!data.public_profile) return null;

  console.log('[Audit] DB Profile by ID', JSON.stringify(data, null, 2));

  // Fetch full analytics for the profile owner
  const analytics = await computeFullAnalyticsForUser(userId);
  const likeCounts = await fetchLikeCountsForUsers([userId]);

  const profile = mapToPublicTrader(data, analytics, likeCounts.get(userId) ?? 0);
  profile.email = (data as any).email ?? null;
  return profile;
}

/**
 * Fetch a single public profile by username.
 * Returns null if the profile is private or doesn't exist.
 */
export async function getPublicProfileByUsername(
  username: string
): Promise<PublicTraderProfile | null> {
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

  console.log('[Audit] DB Profile by username', JSON.stringify(data, null, 2));

  // Fetch full analytics for the profile owner
  const analytics = await computeFullAnalyticsForUser(data.id);
  const likeCounts = await fetchLikeCountsForUsers([data.id]);

  const profile = mapToPublicTrader(data, analytics, likeCounts.get(data.id) ?? 0);
  profile.email = (data as any).email ?? null;
  return profile;
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
 * Notify a user that someone followed them (call when follow/connection succeeds).
 */
export async function notifyFollowReceived(
  recipientId: string,
  followerName: string
): Promise<void> {
  const { notify } = await import('@/lib/notify');
  await notify.follow(recipientId, followerName);
}

/**
 * Notify a user that someone liked their trade.
 */
export async function notifyTradeLiked(
  recipientId: string,
  actorName: string,
  asset?: string
): Promise<void> {
  const { notify } = await import('@/lib/notify');
  await notify.like(recipientId, actorName, asset);
}

/**
 * Notify a user that someone commented on their trade.
 */
export async function notifyTradeCommented(
  recipientId: string,
  actorName: string,
  asset?: string
): Promise<void> {
  const { notify } = await import('@/lib/notify');
  await notify.comment(recipientId, actorName, asset);
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
  console.warn(
    '[communityService] acceptConnectionRequest: connections table not yet implemented.'
  );
  throw new Error('Connections feature is not yet available');
}

/**
 * Decline a pending connection request.
 */
export async function declineConnectionRequest(connectionId: string): Promise<Connection> {
  console.warn(
    '[communityService] declineConnectionRequest: connections table not yet implemented.'
  );
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
 * Analytics are computed from the full trades dataset using the shared analytics engine.
 */
function mapToPublicTrader(
  profile: any,
  analytics?: TradeAnalytics,
  likeCount: number = 0
): PublicTraderProfile {
  const totalTrades = analytics?.totalTrades ?? 0;
  const winRate = analytics?.winRate ?? null;
  const winCount = analytics?.winCount ?? 0;
  const lossCount = analytics?.lossCount ?? 0;
  const breakevenCount = analytics?.breakevenCount ?? 0;

  console.log("Community trader", profile.id);
  console.log("Stats", totalTrades, winRate);

  const trader: PublicTraderProfile = {
    id: profile.id,
    username: profile.username ?? null,
    fullName: profile.full_name ?? null,
    full_name: profile.full_name ?? null,
    bio: profile.bio ?? null,
    avatarUrl: profile.avatar_url ?? null,
    avatar_url: profile.avatar_url ?? null,
    country: profile.country ?? null,
    tradingStyle: profile.trading_style ?? null,
    markets: profile.markets
      ? profile.markets
          .split(',')
          .map((m: string) => m.trim())
          .filter(Boolean)
      : null,
    experience: profile.experience ?? null,
    tradesLogged: totalTrades,
    totalTrades,
    winRate,
    wins: winCount,
    winCount,
    losses: lossCount,
    lossCount,
    breakeven: breakevenCount,
    breakevenCount,
    totalPnl: analytics?.totalPnl ?? null,
    avgRr: analytics?.avgRr ?? null,
    showStats: profile.show_stats ?? true,
    publicProfile: profile.public_profile,
    createdAt: profile.created_at,
    website: profile.website ?? null,
    twitter: profile.twitter ?? null,
    instagram: profile.instagram ?? null,
    instagramAvatar: profile.instagram_avatar ?? null,
    linkedin: profile.linkedin ?? null,
    youtube: profile.youtube ?? null,
    github: profile.github ?? null,
    discord: profile.discord ?? null,
    telegram: profile.telegram ?? null,
    bestTrade: analytics?.bestTrade ?? null,
    worstTrade: analytics?.worstTrade ?? null,
    currentStreak: analytics?.currentStreak ?? { type: 'none', count: 0 },
    pnlTrend: analytics?.pnlTrend ?? [],
    marketDistribution: analytics?.marketDistribution ?? [],
    likes: likeCount,
    likeCount,
  };
  console.log("AFTER MAP", trader);
  return trader;
}
