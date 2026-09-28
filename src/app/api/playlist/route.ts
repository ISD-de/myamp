import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Pfad zur Speicherdatei auf dem Server
const dataFilePath = path.join(process.cwd(), 'playlist-data.json');

// Hilfsfunktion zum Lesen der Daten
function readPlaylistData() {
  try {
    if (!fs.existsSync(dataFilePath)) {
      const initial = {
        playlist: [],
        currentIndex: -1,
        isShuffle: false,
        playedIds: []
      };
      fs.writeFileSync(dataFilePath, JSON.stringify(initial, null, 2));
      return initial;
    }
    const fileContent = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Fehler beim Lesen der Playlist-Datei:', error);
    return { playlist: [], currentIndex: -1, isShuffle: false, playedIds: [] };
  }
}

// Hilfsfunktion zum Schreiben der Daten
function writePlaylistData(data: any) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fehler beim Schreiben der Playlist-Datei:', error);
  }
}

// GET: Playlist vom Server abrufen
export async function GET() {
  const data = readPlaylistData();
  return NextResponse.json(data);
}

// POST: Playlist auf dem Server aktualisieren
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const currentData = readPlaylistData();
    
    const updatedData = {
      playlist: body.playlist !== undefined ? body.playlist : currentData.playlist,
      currentIndex: body.currentIndex !== undefined ? body.currentIndex : currentData.currentIndex,
      isShuffle: body.isShuffle !== undefined ? body.isShuffle : currentData.isShuffle,
      playedIds: body.playedIds !== undefined ? body.playedIds : currentData.playedIds,
    };
    
    writePlaylistData(updatedData);
    return NextResponse.json({ success: true, data: updatedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Ungültige Daten' }, { status: 400 });
  }
}