import { NextResponse } from 'next/server';
import { createIndex, getIndices } from '@/lib/indices';

export async function GET() {
  try {
    const indices = await getIndices();
    return NextResponse.json({ indices });
  } catch (error) {
    console.error('Error fetching indices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch indices' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, rules } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    
    const index = await createIndex(name, description, rules || []);
    return NextResponse.json({ index }, { status: 201 });
  } catch (error) {
    console.error('Error creating index:', error);
    return NextResponse.json(
      { error: 'Failed to create index' },
      { status: 500 }
    );
  }
}
