'use client';

import React, { useEffect, useState } from 'react';
import * as musicMetadata from 'music-metadata-browser';

interface SongListerProps {
  folderName: string | null;
  onSelectSong?: (songName: string) => void;
  onAddAlbumToPlaylist?: (songs: string[]) => void;
}

interface SongMetadata {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  bitrate?: number;
}

export const SongLister = ({
                             folderName,
                             onSelectSong,
                             onAddAlbumToPlaylist,
                           }: SongListerProps) => {
  const [songs, setSongs] = useState<string[]>([]);
  const [metadataMap, setMetadataMap] = useState<Record<string, SongMetadata>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!folderName) {
      setSongs([]);
      setMetadataMap({});
      setSearchTerm('');
      return;
    }
    
    const loadSongs = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/songs?folder=${encodeURIComponent(folderName)}`);
        const data = await response.json();
        
        if (data.success && Array.isArray(data.songs)) {
          setSongs(data.songs);
          if (data.metadataMap) {
            setMetadataMap(data.metadataMap);
          }
        } else {
          setError(data.error || 'Fehler beim Laden der Songs');
          setSongs([]);
        }
      } catch (err: any) {
        setError(err.message || 'Netzwerkfehler beim Laden der Songs');
        setSongs([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadSongs();
  }, [folderName]);
  
  // Funktion zum Speichern einzelner Metadaten auf dem Server
  const saveMetadataToServer = async (song: string, meta: SongMetadata) => {
    if (!folderName) return;
    try {
      await fetch('/api/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: folderName, song, metadata: meta }),
      });
    } catch (err) {
      console.warn('Fehler beim Speichern der Metadaten auf dem Server:', err);
    }
  };
  
  // Metadaten für Songs parsen, die noch nicht im Server-Cache waren
  useEffect(() => {
    if (!folderName || songs.length === 0) return;
    
    songs.forEach(async (song) => {
      if (metadataMap[song]) return; // Bereits im Cache vorhanden
      
      const audioUrl = `/api/stream?folder=${encodeURIComponent(
        folderName
      )}&song=${encodeURIComponent(song)}`;
      
      try {
        const metadata = await musicMetadata.fetchFromUrl(audioUrl);
        const parsedMeta: SongMetadata = {
          title: metadata.common.title,
          artist: metadata.common.artist,
          album: metadata.common.album,
          duration: metadata.format.duration,
          bitrate: metadata.format.bitrate
            ? Math.round(metadata.format.bitrate / 1000)
            : undefined,
        };
        
        setMetadataMap((prev) => {
          const updated = { ...prev, [song]: parsedMeta };
          return updated;
        });
        
        // Direkt persistent auf dem Server abspeichern
        saveMetadataToServer(song, parsedMeta);
      } catch (err) {
        console.warn(`Metadaten konnten für ${song} nicht geladen werden:`, err);
      }
    });
  }, [songs, folderName, metadataMap]);
  
  const handleSongClick = (song: string) => {
    if (onSelectSong) {
      onSelectSong(song);
    }
  };
  
  const handleAddAlbumClick = () => {
    if (onAddAlbumToPlaylist && songs.length > 0) {
      const songsToAdd = searchTerm ? filteredSongs : songs;
      onAddAlbumToPlaylist(songsToAdd);
    }
  };
  
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
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
      <div className="w-full h-fit p-3 text-xs text-theme-muted border-2 border-theme-border bg-theme-panel font-mono transition-colors duration-300">
        Bitte wähle ein Album aus.
      </div>
    );
  }
  
  return (
    <div className="border-2 border-theme-border bg-theme-panel text-theme-text flex flex-col font-mono h-full overflow-hidden transition-colors duration-300">
      
      {/* SUCH-HEADER & ALBUM-BUTTON */}
      <div className="p-1.5 border-b border-theme-border flex items-center gap-1.5 bg-theme-bg/60 shrink-0">
        <div className="relative flex-1 flex items-center">
          <input
            type="text"
            placeholder="Songs, Titel oder Interpret suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={loading || !!error}
            className="w-full bg-theme-bg text-theme-text text-xs px-2 py-1 pr-6 border border-theme-border/60 focus:outline-none focus:border-theme-border placeholder:text-theme-muted/50 disabled:opacity-50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-1 text-xs text-theme-muted hover:text-theme-text px-1 cursor-pointer"
              title="Suche zurücksetzen"
            >
              ✕
            </button>
          )}
        </div>
        
        {songs.length > 0 && onAddAlbumToPlaylist && (
          <button
            onClick={handleAddAlbumClick}
            className="text-[10px] bg-theme-accent/20 hover:bg-theme-accent/40 text-theme-text border border-theme-border/70 px-2 py-1 whitespace-nowrap active:scale-95 transition-all shrink-0 cursor-pointer font-bold"
            title="Ganze Liste zur Playlist hinzufügen"
          >
            + Album ({filteredSongs.length})
          </button>
        )}
      </div>
      
      {/* SONGLISTE */}
      <div className="w-full flex-1 min-h-0 overflow-y-auto snap-y snap-mandatory flex flex-col">
        {loading && (
          <div className="p-3 text-xs text-theme-muted animate-pulse">
            ⏳ Lade MP3s...
          </div>
        )}
        
        {error && (
          <div className="text-xs bg-red-950/60 text-red-400 p-3 border-b border-theme-border">
            ⚠️ {error}
          </div>
        )}
        
        {!loading && !error && songs.length === 0 && (
          <div className="p-3 text-xs text-theme-muted text-center italic">
            Keine MP3-Dateien in diesem Ordner gefunden.
          </div>
        )}
        
        {!loading && !error && songs.length > 0 && (
          <>
            {filteredSongs.length > 0 ? (
              <div className="border-b border-theme-border/40">
                <ul className="flex flex-col">
                  {filteredSongs.map((song, index) => {
                    const meta = metadataMap[song];
                    
                    return (
                      <li
                        key={index}
                        onClick={() => handleSongClick(song)}
                        className="snap-start text-theme-text text-xs hover:bg-theme-accent/20 border-b border-theme-border/40 p-2 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex flex-col truncate">
                          <span className="truncate font-medium">
                            {meta?.title ? meta.title : song.replace('.mp3', '')}
                          </span>
                          {meta?.artist && (
                            <span className="text-[10px] text-theme-muted truncate">
                              {meta.artist} {meta.album ? `• ${meta.album}` : ''}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-[10px] text-theme-muted shrink-0">
                          {meta?.bitrate && (
                            <span className="bg-theme-bg text-theme-border px-1 py-0.5 border border-theme-border/50 font-mono">
                              {meta.bitrate} kbps
                            </span>
                          )}
                          <span className="font-mono">{formatDuration(meta?.duration)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="p-4 text-xs text-theme-muted text-center italic">
                Keine Songs gefunden
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SongLister;