import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folderParam = searchParams.get('folder');
    const songParam = searchParams.get('song');
    
    if (!folderParam || !songParam) {
      return new NextResponse('Ordner oder Song fehlt', { status: 400 });
    }
    
    const baseDirectory = process.env.MUSIC_DIRECTORY;
    if (!baseDirectory) {
      return new NextResponse('MUSIC_DIRECTORY nicht in .env.local konfiguriert', { status: 500 });
    }
    
    // Exakten absoluten Dateipfad auflösen
    const filePath = path.resolve(baseDirectory, folderParam, songParam);
    
    // Sicherheitscheck: Verhindern, dass aus dem Basisordner ausgebrochen wird
    if (!filePath.startsWith(path.resolve(baseDirectory))) {
      return new NextResponse('Zugriff verweigert', { status: 403 });
    }
    
    if (!fs.existsSync(filePath)) {
      console.error('Datei nicht gefunden unter:', filePath);
      return new NextResponse(`Datei nicht gefunden: ${filePath}`, { status: 404 });
    }
    
    // Datei einlesen
    const fileBuffer = fs.readFileSync(filePath);
    const stat = fs.statSync(filePath);
    
    // Sauberer Buffer-Return für den Browser
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Streaming-Fehler:', error);
    return new NextResponse(`Serverfehler: ${error.message}`, { status: 500 });
  }
}