import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Pfad zur JSON-Datei auf dem Server
const filePath = path.join(process.cwd(), 'data', 'playlists.json');

// Hilfsfunktion zum Sicherstellen, dass der Ordner existiert
const ensureDirectoryExists = () => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// GET: Alle gespeicherten Playlisten abrufen
export async function GET() {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([]);
    }
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const playlists = JSON.parse(fileData);
    return NextResponse.json(playlists);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Laden der Playlisten' }, { status: 500 });
  }
}

// POST: Playlist in der JSON-Datei speichern
export async function POST(request: Request) {
  try {
    ensureDirectoryExists();
    const newPlaylist = await request.json();
    
    let playlists = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf-8');
      playlists = JSON.parse(fileData);
    }
    
    // Vorhandene Liste mit gleichem Namen ersetzen oder neue hinzufügen
    const filtered = playlists.filter((p: any) => p.name !== newPlaylist.name);
    const updated = [newPlaylist, ...filtered];
    
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
    return NextResponse.json({ success: true, playlists: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Speichern der Playlist' }, { status: 500 });
  }
}

// DELETE: Eine Playlist anhand des Namens löschen
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    
    if (!name || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    }
    
    const fileData = fs.readFileSync(filePath, 'utf-8');
    let playlists = JSON.parse(fileData);
    playlists = playlists.filter((p: any) => p.name !== name);
    
    fs.writeFileSync(filePath, JSON.stringify(playlists, null, 2), 'utf-8');
    return NextResponse.json({ success: true, playlists });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}