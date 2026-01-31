import { NextResponse } from 'next/server';
import { getIndex, updateIndex, deleteIndex } from '@/lib/indices';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const index = await getIndex(params.id);
    
    if (!index) {
      return NextResponse.json(
        { error: 'Index not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ index });
  } catch (error) {
    console.error('Error fetching index:', error);
    return NextResponse.json(
      { error: 'Failed to fetch index' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const existing = await getIndex(params.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Index not found' },
        { status: 404 }
      );
    }
    
    await updateIndex(params.id, body);
    const updated = await getIndex(params.id);
    
    return NextResponse.json({ index: updated });
  } catch (error) {
    console.error('Error updating index:', error);
    return NextResponse.json(
      { error: 'Failed to update index' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await getIndex(params.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Index not found' },
        { status: 404 }
      );
    }
    
    await deleteIndex(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting index:', error);
    return NextResponse.json(
      { error: 'Failed to delete index' },
      { status: 500 }
    );
  }
}
