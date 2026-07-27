import { NextResponse } from 'next/server';
import { getPublicTraders } from '@/services/communityService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? '1');
  const searchQuery = searchParams.get('searchQuery') ?? undefined;
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';

  try {
    const result = await getPublicTraders(page, searchQuery, sortBy);
    console.log(
      '[API /api/community/traders] Raw result traders:',
      JSON.stringify(
        result.traders.map((t) => ({
          id: t.id,
          username: t.username,
          tradesLogged: t.tradesLogged,
          winRate: t.winRate,
          totalPnl: t.totalPnl,
          likeCount: t.likeCount,
          showStats: t.showStats,
        })),
        null,
        2
      )
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/community/traders] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load traders' },
      { status: 500 }
    );
  }
}
