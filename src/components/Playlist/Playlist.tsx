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
    <div className="flex flex-col h-full bg-player-bg/90 border border-player-border p-2 rounded text-xs font-mono">
      <div className="flex items-center justify-between border-b border-player-border/50 pb-2 mb-2">
        <span className="font-bold text-text-light">
          PLAYLIST ({items.length})
          {playedIds.length > 0 && (
            <span className="text-[10px] text-purple-400 font-normal ml-2">
              ({playedIds.length}/{items.length} gespielt)
            </span>
          )}
        </span>
        {items.length > 0 && (
          <button
            onClick={onClearPlaylist}
            className="text-red-400 hover:text-red-300 transition text-[10px] border border-red-900/50 px-1.5 py-0.5 rounded"
          >
            Leeren
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {items.length === 0 ? (
          <div className="text-gray-500 italic text-center py-4">Playlist ist leer</div>
        ) : (
          items.map((item, index) => {
            const isActive = index === currentIndex;
            const isPlayed = playedIds.includes(item.id);
            
            // Ermittlung des passenden Symbols
            let statusIcon: React.ReactNode = index + 1;
            if (isActive && isPlayed) {
              statusIcon = <span className="text-purple-400 font-bold">▶✓</span>;
            } else if (isActive) {
              statusIcon = <span className="text-green-400 font-bold">▶</span>;
            } else if (isPlayed) {
              statusIcon = <span className="text-gray-400 font-bold">✓</span>;
            }
            
            return (
              <div
                key={item.id}
                onClick={() => onSelectTrack(index)}
                className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition border ${
                  isActive
                    ? 'bg-purple-950/80 border-purple-500 text-white font-bold'
                    : isPlayed
                      ? 'bg-black/20 border-transparent text-gray-400 opacity-70 hover:opacity-100'
                      : 'bg-black/40 border-player-border/30 text-gray-200 hover:bg-black/60'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden mr-2">
                  <span className="text-[10px] w-6 flex justify-center text-gray-500 shrink-0">
                    {statusIcon}
                  </span>
                  <span className="truncate" title={item.songName}>
                    {item.songName}
                  </span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTrack(item.id);
                  }}
                  className="text-gray-500 hover:text-red-400 p-0.5 text-xs transition shrink-0"
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