import { NextResponse } from 'next/server';
import { getPublicTraders } from '@/services/communityService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') ?? '1');
  const searchQuery = searchParams.get('searchQuery') ?? undefined;
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';

  try {
    const result = await getPublicTraders(page, searchQuery, sortBy);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/community/traders] Error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load traders' },
      { status: 500 }
    );
  }
}
