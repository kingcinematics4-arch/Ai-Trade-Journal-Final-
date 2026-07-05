// ─── Community / Connection Types ─────────────────────────────────────────────

/** A connection request between two users */
export interface DbConnection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  requesterId: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export function mapDbConnection(row: DbConnection): Connection {
  return {
    id: row.id,
    requesterId: row.requester_id,
    recipientId: row.recipient_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** A public profile visible in the community (subset of Profile) */
export interface PublicTraderProfile {
  id: string;
  username: string | null;
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  country: string | null;
  tradingStyle: string | null;
  /** Parsed array of markets (split from the comma-separated DB column) */
  markets: string[] | null;
  experience: string | null;
  tradesLogged: number;
  winRate: number | null;
  totalPnl: number | null;
  avgRr: number | null;
  showStats: boolean;
  publicProfile: boolean;
  createdAt: string;
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  instagramAvatar: string | null;
  linkedin: string | null;
  youtube: string | null;
  github: string | null;
  discord: string | null;
  telegram: string | null;
}

/** Pagination response for community queries */
export interface PaginatedTraders {
  traders: PublicTraderProfile[];
  total: number;
  hasMore: boolean;
}
