import { NextResponse } from 'next/server';
import { getSubfolders } from '@/actions/getFolders';

export async function GET() {
  try {
    const folders = await getSubfolders();
    return NextResponse.json({ success: true, folders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Fehler beim Laden der Ordner' },
      { status: 500 }
    );
  }
}