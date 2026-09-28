import { NextResponse } from 'next/server';
import { getSongs } from '@/actions/getSongs';
import fs from 'fs';
import path from 'path';

interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  bitrate?: number;
}

interface CacheData {
  [folderName: string]: {
    songs: string[];
    metadataMap: Record<string, SongMetadata>;
  };
}

const cacheFilePath = path.join(process.cwd(), 'songs-cache.json');

// Hilfsfunktion zum Lesen des Caches
function readSongCache(): CacheData {
  try {
    if (!fs.existsSync(cacheFilePath)) {
      fs.writeFileSync(cacheFilePath, JSON.stringify({}, null, 2));
      return {};
    }
    const content = fs.readFileSync(cacheFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Fehler beim Lesen des Song-Caches:', error);
    return {};
  }
}

// Hilfsfunktion zum Schreiben in den Cache
function writeSongCache(data: CacheData) {
  try {
    fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fehler beim Schreiben des Song-Caches:', error);
  }
}

// GET: Songs für einen Ordner abrufen (inkl. Cache-Prüfung)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder');
  
  if (!folder) {
    return NextResponse.json({ success: false, error: 'Kein Ordner angegeben' }, { status: 400 });
  }
  
  try {
    const cache = readSongCache();
    
    // Prüfen, ob der Ordner schon im Server-Cache liegt
    if (cache[folder] && Array.isArray(cache[folder].songs)) {
      return NextResponse.json({
        success: true,
        songs: cache[folder].songs,
        metadataMap: cache[folder].metadataMap || {},
        cached: true,
      });
    }
    
    // Wenn nicht, frisch von der Festplatte holen
    const songs = await getSongs(folder);
    
    // In den Cache schreiben (Metadaten sind anfangs noch leer, werden nachgeliefert)
    cache[folder] = {
      songs,
      metadataMap: cache[folder]?.metadataMap || {},
    };
    writeSongCache(cache);
    
    return NextResponse.json({
      success: true,
      songs,
      metadataMap: cache[folder].metadataMap,
      cached: false,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Fehler beim Laden der Songs' },
      { status: 500 }
    );
  }
}

// POST: Aktualisierte Metadaten für einen Song/Ordner auf dem Server speichern
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folder, song, metadata } = body;
    
    if (!folder || !song || !metadata) {
      return NextResponse.json({ success: false, error: 'Unvollständige Daten' }, { status: 400 });
    }
    
    const cache = readSongCache();
    if (!cache[folder]) {
      cache[folder] = { songs: [], metadataMap: {} };
    }
    
    // Metadaten für den spezifischen Song aktualisieren/hinzufügen
    cache[folder].metadataMap[song] = metadata;
    writeSongCache(cache);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Fehler beim Speichern der Metadaten' }, { status: 500 });
  }
}