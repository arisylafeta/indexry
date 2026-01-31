import { NextResponse } from 'next/server';
import { getHoldings } from '@/lib/holdings';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const holdings = await getHoldings(params.id);
    return NextResponse.json({ holdings });
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holdings' },
      { status: 500 }
    );
  }
}
