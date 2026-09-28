'use client';

import React, { useState, useEffect } from 'react';
import { PlaylistItem } from '@/components/Catalog/Playlist/Playlist';

interface SavedPlaylist {
  name: string;
  items: PlaylistItem[];
  createdAt: string;
}

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlaylist: PlaylistItem[];
  onLoadPlaylist: (items: PlaylistItem[]) => void;
}

export default function PlaylistModal({
                                        isOpen,
                                        onClose,
                                        currentPlaylist,
                                        onLoadPlaylist,
                                      }: PlaylistModalProps) {
  const [playlistName, setPlaylistName] = useState('');
  const [savedLists, setSavedLists] = useState<SavedPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Gespeicherte Listen beim Öffnen von der API laden
  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
      setPlaylistName(`Playlist ${new Date().toLocaleDateString()}`);
    }
  }, [isOpen]);
  
  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        setSavedLists(data);
      }
    } catch (e) {
      console.error('Fehler beim Abrufen der Playlisten:', e);
    }
  };
  
  if (!isOpen) return null;
  
  const handleSave = async () => {
    if (!playlistName.trim() || currentPlaylist.length === 0) return;
    
    setIsLoading(true);
    const newList: SavedPlaylist = {
      name: playlistName.trim(),
      items: currentPlaylist,
      createdAt: new Date().toISOString(),
    };
    
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList),
      });
      
      if (res.ok) {
        const data = await res.json();
        setSavedLists(data.playlists);
        setPlaylistName('');
      }
    } catch (e) {
      console.error('Fehler beim Speichern:', e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteSaved = async (name: string) => {
    try {
      const res = await fetch(`/api/playlists?name=${encodeURIComponent(name)}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        const data = await res.json();
        setSavedLists(data.playlists);
      }
    } catch (e) {
      console.error('Fehler beim Löschen:', e);
    }
  };
  
  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 font-mono text-xs text-theme-text">
      <div className="bg-theme-panel border-2 border-theme-border w-full max-w-md p-4 flex flex-col gap-4 shadow-2xl">
        
        {/* HEADER */}
        <div className="flex justify-between items-center border-b border-theme-border/50 pb-2">
          <div className="font-bold text-sm">PLAYLIST SPEICHERN / LADEN</div>
          <button onClick={onClose} className="text-theme-muted hover:text-red-400 text-sm cursor-pointer">
            ✕
          </button>
        </div>
        
        {/* AKTUELLE PLAYLIST SPEICHERN */}
        <div className="flex flex-col gap-2 bg-theme-bg/50 p-3 border border-theme-border/30">
          <div className="text-[11px] text-theme-muted">Aktuelle Playlist speichern ({currentPlaylist.length} Songs):</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Playlist-Name..."
              className="flex-1 bg-theme-bg border border-theme-border px-2 py-1 text-xs text-theme-text focus:outline-none focus:border-theme-accent"
            />
            <button
              onClick={handleSave}
              disabled={currentPlaylist.length === 0 || !playlistName.trim() || isLoading}
              className="bg-theme-accent/20 border border-theme-border hover:bg-theme-accent/40 px-3 py-1 cursor-pointer disabled:opacity-30 active:scale-95"
            >
              {isLoading ? '...' : 'Speichern'}
            </button>
          </div>
        </div>
        
        {/* GESPEICHERTE PLAYLISTEN LADEN */}
        <div className="flex flex-col gap-2">
          <div className="text-[11px] text-theme-muted">Aus JSON-Datei geladene Playlisten ({savedLists.length}):</div>
          <div className="max-h-48 overflow-y-auto flex flex-col gap-1.5 pr-1">
            {savedLists.length === 0 ? (
              <div className="text-theme-muted/50 italic text-center py-4">
                Keine Playlisten auf dem Server gefunden
              </div>
            ) : (
              savedLists.map((list) => (
                <div
                  key={list.name}
                  className="flex items-center justify-between bg-theme-bg/80 border border-theme-border/40 p-2 hover:border-theme-border"
                >
                  <div className="flex flex-col truncate">
                    <span className="font-bold truncate">{list.name}</span>
                    <span className="text-[10px] text-theme-muted">{list.items.length} Songs</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onLoadPlaylist(list.items);
                        onClose();
                      }}
                      className="bg-theme-accent/30 border border-theme-border hover:bg-theme-accent/50 px-2 py-0.5 cursor-pointer active:scale-95 text-[10px]"
                    >
                      Laden
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(list.name)}
                      className="text-theme-muted hover:text-red-400 px-1 text-xs cursor-pointer"
                      title="Löschen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* FOOTER */}
        <div className="flex justify-end pt-2 border-t border-theme-border/50">
          <button
            onClick={onClose}
            className="bg-theme-bg border border-theme-border px-3 py-1 hover:bg-theme-accent/20 cursor-pointer"
          >
            Schließen
          </button>
        </div>
      
      </div>
    </div>
  );
}