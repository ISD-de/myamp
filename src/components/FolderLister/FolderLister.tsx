'use client';

import React, { useEffect, useState } from 'react';

interface FolderListerProps {
  onSelectFolder?: (folderName: string) => void;
}

export const FolderLister = ({ onSelectFolder }: FolderListerProps) => {
  const [folders, setFolders] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadFolders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/folders');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.folders)) {
        setFolders(data.folders);
      } else {
        setError(data.error || 'Fehler beim Laden der Ordner');
        setFolders([]);
      }
    } catch (err: any) {
      setError(err.message || 'Netzwerkfehler beim Laden der Ordner');
      setFolders([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadFolders();
  }, []);
  
  const handleRefresh = async () => {
    setSearchTerm('');
    await loadFolders();
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
    <div className="border border-theme-border text-theme-text flex flex-col h-full w-full font-mono transition-colors duration-300">
      
      {/* SUCH-HEADER */}
      <div className="p-1.5 border-b border-theme-border flex items-center gap-2 bg-theme-bg/60 shrink-0">
        <input
          type="text"
          placeholder="Album suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={loading || !!error}
          className="w-full bg-theme-bg text-theme-text text-xs px-2 py-1 border border-theme-border/60 focus:border-theme-border focus:outline-none placeholder:text-theme-muted/50 disabled:opacity-50"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-theme-muted hover:text-theme-text px-1.5 py-0.5 border border-theme-border bg-theme-bg transition active:scale-95 cursor-pointer"
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
          <div className="text-xs bg-red-950/60 text-red-400 p-3 border-b border-theme-border flex flex-col gap-2">
            <div>⚠️ {error}</div>
            <button
              onClick={handleRefresh}
              className="self-start text-[10px] px-2 py-0.5 bg-red-900 text-white border border-red-700 cursor-pointer"
            >
              Erneut versuchen
            </button>
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
                      className="snap-start text-theme-text font-mono hover:bg-theme-accent/20 hover:text-white text-[11px] break-all border-b border-theme-border/40 p-1.5 cursor-pointer transition-colors w-full truncate"
                    >
                      <span className="flex items-center gap-1.5">
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