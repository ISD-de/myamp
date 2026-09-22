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
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (id: string) => void;
  onClearPlaylist: () => void;
}

export const Playlist: React.FC<PlaylistProps> = ({
                                                    items,
                                                    currentIndex,
                                                    onSelectTrack,
                                                    onRemoveTrack,
                                                    onClearPlaylist,
                                                  }) => {
  return (
    <div className="border-player-border border-2 bg-player-bg flex flex-col h-full font-mono">
      {/* Header */}
      <div className="p-1.5 border-b border-player-border flex items-center justify-between bg-background/50 text-xs text-text-light">
        <span className="font-bold">📋 PLAYLIST ({items.length})</span>
        {items.length > 0 && (
          <button
            onClick={onClearPlaylist}
            className="text-[10px] text-red-400 hover:text-red-300 border border-red-900/50 bg-red-950/30 px-1.5 py-0.5 rounded"
            title="Playlist leeren"
          >
            🗑️ Alle löschen
          </button>
        )}
      </div>
      
      {/* Playlist Einträge */}
      <div className="w-full max-h-56 overflow-y-auto flex flex-col">
        {items.length === 0 ? (
          <div className="p-3 text-xs text-gray-500 text-center">
            Playlist ist leer. Klicke auf Songs oder "+ Album", um Titel hinzuzufügen.
          </div>
        ) : (
          <ul className="flex flex-col">
            {items.map((item, index) => {
              const isActive = index === currentIndex;
              return (
                <li
                  key={item.id}
                  className={`text-xs p-1.5 border-b border-player-border/50 flex items-center justify-between gap-2 group transition-colors ${
                    isActive
                      ? 'bg-purple-950/60 text-[#00ffcc] font-bold border-l-2 border-l-[#00ffcc]'
                      : 'text-text-light hover:bg-background-hover'
                  }`}
                >
                  {/* Track Info & Klick zum Abspielen */}
                  <div
                    onClick={() => onSelectTrack(index)}
                    className="flex items-center gap-2 truncate cursor-pointer flex-1"
                  >
                    <span className="text-[10px] text-gray-500 w-4">{index + 1}.</span>
                    <span className="truncate">{item.songName.replace('.mp3', '')}</span>
                  </div>
                  
                  {/* Entfernen Button */}
                  <button
                    onClick={() => onRemoveTrack(item.id)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 px-1 text-xs transition-opacity"
                    title="Von Playlist entfernen"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Playlist;