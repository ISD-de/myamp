'use client';

import React, { useEffect, useState } from 'react';
import { getSubfolders } from '@/actions/getFolders';

const CACHE_KEY = 'music_subfolders_cache';

interface FolderListerProps {
  onSelectFolder?: (folderName: string) => void;
}

export const FolderLister = ({ onSelectFolder }: FolderListerProps) => {
  const [folders, setFolders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
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
          return;
        } catch (e) {
          localStorage.removeItem(CACHE_KEY);
        }
      }
      
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
    setSearchTerm('');
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
  
  const filteredFolders = folders.filter((folder) =>
    folder.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="border-2 border-theme-border bg-theme-panel text-theme-text flex flex-col h-full font-mono overflow-hidden transition-colors duration-300">
      
      {/* SUCH-HEADER */}
      <div className="p-1.5 border-b border-theme-border flex items-center gap-2 bg-theme-bg/60 shrink-0">
        <input
          type="text"
          placeholder="Album suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading || !!error}
          className="w-full bg-theme-bg text-theme-text text-xs px-2 py-1 border border-theme-border/60 focus:border-theme-border focus:outline-none placeholder:text-theme-muted/50 disabled:opacity-50 rounded-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-theme-muted hover:text-theme-text px-1.5 py-0.5 border border-theme-border bg-theme-bg rounded-sm transition active:scale-95 cursor-pointer"
            title="Suche zurücksetzen"
          >
            ✕
          </button>
        )}
      </div>
      
      {/* ALBUM-LISTE */}
      <div className="w-full flex-1 min-h-0 overflow-y-auto snap-y snap-mandatory flex flex-col">
        {loading && (
          <div className="p-3 text-xs text-theme-muted animate-pulse">
            ⏳ Lade Ordner...
          </div>
        )}
        
        {error && (
          <div className="text-xs bg-red-950/60 text-red-400 p-3 border-b border-theme-border">
            ⚠️ {error}
          </div>
        )}
        
        {!loading && !error && (
          <>
            {filteredFolders.length > 0 ? (
              <div className="border-b border-theme-border/40">
                <ul className="flex flex-col">
                  {filteredFolders.map((folder, index) => (
                    <li
                      key={index}
                      onClick={() => handleFolderClick(folder)}
                      className="snap-start text-theme-text hover:bg-theme-accent/20 hover:text-white text-xs break-all border-b border-theme-border/40 p-2 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="text-theme-muted text-[10px]">📁</span>
                        {folder}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="p-4 text-xs text-theme-muted text-center italic">
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