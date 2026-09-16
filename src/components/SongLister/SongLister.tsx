'use client';

import React, {useEffect, useState} from 'react';
import {getSongs} from '@/actions/getSongs';

interface SongListerProps {
  folderName: string | null;
  onSelectSong?: (songName: string) => void;
}

export const SongLister = ({folderName, onSelectSong}: SongListerProps) => {
  const [songs, setSongs] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamischer Cache-Key pro Ordner
  const cacheKey = folderName ? `music_songs_cache_${folderName}` : null;
  
  useEffect(() => {
    if (!folderName || !cacheKey) {
      setSongs([]);
      return;
    }
    
    const loadSongs = async () => {
      setLoading(true);
      setError(null);
      
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setSongs(parsed);
          setLoading(false);
          console.log(`⚡ Songs für "${folderName}" aus localStorage geladen!`);
          return;
        } catch (e) {
          localStorage.removeItem(cacheKey);
        }
      }
      
      console.log(`🎵 Lade Songs für "${folderName}" vom Server...`);
      try {
        const result = await getSongs(folderName);
        setSongs(result);
        localStorage.setItem(cacheKey, JSON.stringify(result));
      } catch (err: any) {
        setError(err.message);
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadSongs();
  }, [folderName, cacheKey]);
  
  const handleSongClick = (song: string) => {
    if (onSelectSong) {
      onSelectSong(song);
    }
  };
  
  if (!folderName) {
    return (
      <div className="w-full h-fit p-3 text-text-light border border-player-border bg-player-bg">
        Bitte wähle einen Ordner aus.
      </div>
    );
  }
  
  return (
    <div className="border-player-border border-2">
      <div className="w-full max-h-56 overflow-y-auto snap-y snap-mandatory bg-player-bg flex flex-col gap-4">
        {loading && <div className="p-3 text-main border border-border">Lade MP3s...</div>}
        {error && <div className="text-main text-sm bg-red-950/50 p-3 border border-border">{error}</div>}
        {!loading && !error && songs.length === 0 && (
          <div className="p-3 text-main border border-border">Keine MP3-Dateien in diesem Ordner gefunden.</div>
        )}
        
        {!loading && !error && songs.length > 0 && (
          <div className="border border-player-border">
            <ul className="flex flex-col">
              {songs.map((song, index) => (
                <li
                  key={index}
                  onClick={() => handleSongClick(song)}
                  className="snap-start text-text-light text-xs hover:bg-background-hover break-all border-y border-player-border p-1 -mb-px cursor-pointer flex items-center gap-2"
                >
                  <span>{song.replace('.mp3', '')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongLister;