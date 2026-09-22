'use server';

import fs from 'fs/promises';
import path from 'path';

export async function getSongs(folderName: string): Promise<string[]> {
  const baseDirectory = process.env.MUSIC_DIRECTORY;
  
  if (!baseDirectory) {
    throw new Error('MUSIC_DIRECTORY ist nicht in der .env.local definiert.');
  }
  
  // Pfad zum Ziel-Unterordner zusammenbauen
  const targetFolder = path.join(baseDirectory, folderName);
  
  try {
    const entries = await fs.readdir(targetFolder, { withFileTypes: true });
    
    // Nur Dateien filtern, die auf .mp3 enden (case-insensitive)
    const mp3Files = entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.mp3'))
      .map((entry) => entry.name);
    
    return mp3Files;
  } catch (error: any) {
    console.error(`Fehler beim Auslesen des Ordners ${folderName}:`, error);
    throw new Error(`Dateien konnten nicht geladen werden: ${error.message}`);
  }
}