'use client';

import React from 'react';

export interface PlaylistItem {
  id: string;
  folderName: string;
  songName: string;
}

interface PlaylistProps {
  items: PlaylistItem[];
  currentIndex: number;
  playedIds?: string[];
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (id: string) => void;
  onClearPlaylist: () => void;
}

export default function Playlist({
                                   items,
                                   currentIndex,
                                   playedIds = [],
                                   onSelectTrack,
                                   onRemoveTrack,
                                   onClearPlaylist,
                                 }: PlaylistProps) {
  return (
    <div className="flex flex-col h-full bg-theme-panel border-2 border-theme-border p-2 font-mono text-xs text-theme-text transition-colors duration-300 overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-theme-border/50 pb-2 mb-2 shrink-0">
        <span className="font-bold text-theme-text flex items-center">
          PLAYLIST ({items.length})
          {playedIds.length > 0 && (
            <span className="text-[10px] text-theme-muted font-normal ml-2">
              ({playedIds.length}/{items.length} gespielt)
            </span>
          )}
        </span>
        {items.length > 0 && (
          <button
            onClick={onClearPlaylist}
            className="text-red-400 hover:text-red-300 transition text-[10px] border border-red-900/60 bg-red-950/40 px-1.5 py-0.5 active:scale-95 cursor-pointer"
          >
            Leeren
          </button>
        )}
      </div>
      
      {/* TRACK LIST */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
        {items.length === 0 ? (
          <div className="text-theme-muted/50 italic text-center py-4">
            Playlist ist leer
          </div>
        ) : (
          items.map((item, index) => {
            const isActive = index === currentIndex;
            const isPlayed = playedIds.includes(item.id);
            
            // Ermittlung des passenden Symbols
            let statusIcon: React.ReactNode = index + 1;
            if (isActive && isPlayed) {
              statusIcon = <span className="text-theme-border font-bold">▶✓</span>;
            } else if (isActive) {
              statusIcon = <span className="text-theme-border font-bold">▶</span>;
            } else if (isPlayed) {
              statusIcon = <span className="text-theme-muted font-bold">✓</span>;
            }
            
            return (
              <div
                key={item.id}
                onClick={() => onSelectTrack(index)}
                className={`flex items-center justify-between p-1.5 cursor-pointer transition border ${
                  isActive
                    ? 'bg-theme-accent/30 border-theme-border text-white font-bold'
                    : isPlayed
                      ? 'bg-theme-bg/30 border-transparent text-theme-muted/60 opacity-70 hover:opacity-100'
                      : 'bg-theme-bg/60 border-theme-border/30 text-theme-text hover:bg-theme-accent/10'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <span className="text-[10px] w-6 flex justify-center text-theme-muted shrink-0 font-mono">
                    {statusIcon}
                  </span>
                  <span className="truncate" title={item.songName}>
                    {item.songName.replace('.mp3', '')}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTrack(item.id);
                  }}
                  className="text-theme-muted/60 hover:text-red-400 p-0.5 text-xs transition shrink-0 cursor-pointer"
                  title="Entfernen"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}