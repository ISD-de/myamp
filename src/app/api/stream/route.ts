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
    
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get('range');
    
    // CORS & Basis-Header
    const headers = new Headers({
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    });
    
    // 1. PARTIAL CONTENT (HTTP Range Requests - Wichtig für Audio-Seeking & Web Audio API)
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }
      
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      
      // Node Stream zu Web ReadableStream konvertieren
      const readableStream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
        cancel() {
          fileStream.destroy();
        },
      });
      
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      headers.set('Content-Length', chunkSize.toString());
      
      return new NextResponse(readableStream as unknown as BodyInit, {
        status: 206, // Partial Content
        headers,
      });
    }
    
    // 2. VOLLSTÄNDIGER STREAM (Falls kein Range-Header gesendet wird)
    const fileStream = fs.createReadStream(filePath);
    const readableStream = new ReadableStream({
      start(controller) {
        fileStream.on('data', (chunk) => controller.enqueue(chunk));
        fileStream.on('end', () => controller.close());
        fileStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });
    
    headers.set('Content-Length', fileSize.toString());
    
    return new NextResponse(readableStream as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Streaming-Fehler:', error);
    return new NextResponse(`Serverfehler: ${error.message}`, { status: 500 });
  }
}

// OPTIONS Preflight für CORS unterstützen
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
    },
  });
}