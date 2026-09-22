'use client';

import React, { useEffect, useState } from 'react';
import * as musicMetadata from 'music-metadata-browser';
import { getSongs } from '@/actions/getSongs';

interface SongListerProps {
  folderName: string | null;
  onSelectSong?: (songName: string) => void;
}

interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  bitrate?: number;
}

export const SongLister = ({ folderName, onSelectSong }: SongListerProps) => {
  const [songs, setSongs] = useState<string[]>([]);
  const [metadataMap, setMetadataMap] = useState<Record<string, SongMetadata>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dynamischer Cache-Key pro Ordner
  const cacheKey = folderName ? `music_songs_cache_${folderName}` : null;
  const metaCacheKey = folderName ? `music_meta_cache_${folderName}` : null;
  
  useEffect(() => {
    if (!folderName || !cacheKey || !metaCacheKey) {
      setSongs([]);
      setMetadataMap({});
      setSearchTerm('');
      return;
    }
    
    const loadSongs = async () => {
      setLoading(true);
      setError(null);
      
      // Metadaten-Cache laden
      const cachedMeta = localStorage.getItem(metaCacheKey);
      if (cachedMeta) {
        try {
          setMetadataMap(JSON.parse(cachedMeta));
        } catch (e) {
          localStorage.removeItem(metaCacheKey);
        }
      }
      
      // Songs-Cache laden
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
  }, [folderName, cacheKey, metaCacheKey]);
  
  // Metadaten für gefundene Songs parsen
  useEffect(() => {
    if (!folderName || songs.length === 0 || !metaCacheKey) return;
    
    songs.forEach(async (song) => {
      if (metadataMap[song]) return; // Bereits geparst
      
      const audioUrl = `/api/stream?folder=${encodeURIComponent(folderName)}&song=${encodeURIComponent(song)}`;
      
      try {
        const metadata = await musicMetadata.fetchFromUrl(audioUrl);
        const parsedMeta: SongMetadata = {
          title: metadata.common.title,
          artist: metadata.common.artist,
          album: metadata.common.album,
          duration: metadata.format.duration,
          bitrate: metadata.format.bitrate ? Math.round(metadata.format.bitrate / 1000) : undefined,
        };
        
        setMetadataMap((prev) => {
          const updated = { ...prev, [song]: parsedMeta };
          localStorage.setItem(metaCacheKey, JSON.stringify(updated));
          return updated;
        });
      } catch (err) {
        console.warn(`Metadaten konnten für ${song} nicht geladen werden:`, err);
      }
    });
  }, [songs, folderName, metaCacheKey]);
  
  const handleSongClick = (song: string) => {
    if (onSelectSong) {
      onSelectSong(song);
    }
  };
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Filterung basierend auf Dateiname, Titel oder Interpret
  const filteredSongs = songs.filter((song) => {
    const meta = metadataMap[song];
    const search = searchTerm.toLowerCase();
    const songNameMatch = song.toLowerCase().includes(search);
    const titleMatch = meta?.title?.toLowerCase().includes(search);
    const artistMatch = meta?.artist?.toLowerCase().includes(search);
    
    return songNameMatch || titleMatch || artistMatch;
  });
  
  if (!folderName) {
    return (
      <div className="w-full h-fit p-3 text-xs text-text-light border border-player-border bg-player-bg font-mono">
        Bitte wähle einen Ordner aus.
      </div>
    );
  }
  
  return (
    <div className="border-player-border border-2 bg-player-bg flex flex-col gap-1 font-mono">
      {/* Such-Header mit Filterung */}
      <div className="p-1.5 border-b border-player-border flex items-center gap-2 bg-background/50">
        <input
          type="text"
          placeholder="Songs, Titel oder Interpret suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading || !!error}
          className="w-full bg-player-bg text-text-light text-xs px-2 py-1 border border-player-border rounded focus:outline-none focus:border-purple-500 placeholder:text-gray-500 disabled:opacity-50"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5 border border-player-border rounded bg-player-bg"
            title="Suche zurücksetzen"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Songliste */}
      <div className="w-full max-h-56 overflow-y-auto snap-y snap-mandatory flex flex-col">
        {loading && <div className="p-3 text-xs text-main border border-border">Lade MP3s...</div>}
        {error && (
          <div className="text-main text-sm bg-red-950/50 p-3 border border-border">{error}</div>
        )}
        
        {!loading && !error && songs.length === 0 && (
          <div className="p-3 text-xs text-main border border-border">
            Keine MP3-Dateien in diesem Ordner gefunden.
          </div>
        )}
        
        {!loading && !error && songs.length > 0 && (
          <>
            {filteredSongs.length > 0 ? (
              <div className="border border-player-border">
                <ul className="flex flex-col">
                  {filteredSongs.map((song, index) => {
                    const meta = metadataMap[song];
                    
                    return (
                      <li
                        key={index}
                        onClick={() => handleSongClick(song)}
                        className="snap-start text-text-light text-xs hover:bg-background-hover border-b border-player-border p-1.5 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                      >
                        {/* Title / Artist oder Dateiname */}
                        <div className="flex flex-col truncate">
                          <span className="truncate font-medium">
                            {meta?.title ? meta.title : song.replace('.mp3', '')}
                          </span>
                          {meta?.artist && (
                            <span className="text-[10px] text-gray-400 truncate">
                              {meta.artist} {meta.album ? `• ${meta.album}` : ''}
                            </span>
                          )}
                        </div>
                        
                        {/* Metadaten (Bitrate & Spielzeit) */}
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 shrink-0">
                          {meta?.bitrate && (
                            <span className="bg-black/50 text-[#00ffcc] px-1 py-0.5 rounded border border-gray-800">
                              {meta.bitrate} kbps
                            </span>
                          )}
                          <span>{formatDuration(meta?.duration)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="p-3 text-xs text-gray-400 text-center">Keine Songs gefunden</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SongLister;