'use server';

import fs from 'fs/promises';

const fetchFoldersFromDisk = async (): Promise<string[]> => {
  const targetDirectory = process.env.MUSIC_DIRECTORY;
  
  if (!targetDirectory) {
    throw new Error('MUSIC_DIRECTORY ist nicht in der .env.local definiert.');
  }
  
  console.log('📁 Lese Ordner vom Dateisystem aus (kein Cache)...');
  
  try {
    const entries = await fs.readdir(targetDirectory, {withFileTypes: true});
    
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
  } catch (error: any) {
    console.error('Fehler beim Auslesen des Ordners:', error);
    throw new Error(`Ordner (${targetDirectory}) konnte nicht gelesen werden: ${error.message}`);
  }
}

export const getSubfolders = async (): Promise<string[]> => {
  return await fetchFoldersFromDisk();
}
