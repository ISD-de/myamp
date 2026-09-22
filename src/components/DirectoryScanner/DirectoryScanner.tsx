'use client';

import React, { useEffect, useState } from 'react';
import { getSubfolders } from '@/actions/getFolders';

const CACHE_KEY = 'music_subfolders_cache';

interface FolderListerProps {
  onSelectFolder?: (folderName: string) => void;
}

export const FolderLister = ({ onSelectFolder }: FolderListerProps) => {
  const [folders, setFolders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>(''); // State für Suchbegriff
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadFolders = async () => {
      setLoading(true);
      setError(null);
      
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          setFolders(parsed);
          setLoading(false);
          console.log('⚡ Ordner aus localStorage geladen!');
          return;
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
      
      console.log('📁 Kein Cache gefunden. Rufe Server Action auf...');
      try {
        const result = await getSubfolders();
        setFolders(result);
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      } catch (err: any) {
        setError(err.message);
        setFolders([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadFolders();
  }, []);
  
  const handleRefresh = async () => {
    localStorage.removeItem(CACHE_KEY);
    setSearchTerm(''); // Suche bei Refresh zurücksetzen
    setLoading(true);
    try {
      const result = await getSubfolders();
      setFolders(result);
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFolderClick = (folder: string) => {
    if (onSelectFolder) {
      onSelectFolder(folder);
    }
  };
  
  // Gefilterte Ordnerliste basierend auf der Sucheingabe
  const filteredFolders = folders.filter((folder) =>
    folder.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="border-player-border border-2 bg-player-bg flex flex-col gap-1">
      {/* Such-Header mit Input & Reset-Option */}
      <div className="p-1.5 border-b border-player-border flex items-center gap-2 bg-background/50">
        <input
          type="text"
          placeholder="Album suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading || !!error}
          className="w-full bg-player-bg text-text-light text-xs px-2 py-1 border border-player-border focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5 border border-player-border bg-player-bg"
            title="Suche zurücksetzen"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Liste & Lade- / Fehlerzustände */}
      <div className="w-full max-h-56 overflow-auto overflow-y-auto snap-y snap-mandatory flex flex-col">
        {loading && <div className="p-3 text-main border border-border">Lade Ordner...</div>}
        {error && (
          <div className="text-main text-sm bg-red-950/50 p-3 border border-border">{error}</div>
        )}
        
        {!loading && !error && (
          <>
            {filteredFolders.length > 0 ? (
              <div className="border border-player-border">
                <ul className="flex flex-col">
                  {filteredFolders.map((folder, index) => (
                    <li
                      key={index}
                      onClick={() => handleFolderClick(folder)}
                      className="snap-start text-text-light hover:bg-background-hover text-xs break-all border border-player-border p-1 -mb-px cursor-pointer"
                    >
                      <span>{folder}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-3 text-xs text-gray-400 text-center">
                {searchTerm ? 'Keine Alben gefunden' : 'Keine Alben vorhanden'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FolderLister;