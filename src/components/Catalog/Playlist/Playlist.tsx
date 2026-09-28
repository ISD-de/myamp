'use client';

import React, { useEffect, useRef, useState } from 'react';
import { parseSongString } from '@/lib/ParsedSong';
import PlaylistModal from '@/components/Catalog/Playlist/PlaylistModal/PlaylistModal';

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
  onResetPlayed?: () => void;
  onLoadPlaylist: (items: PlaylistItem[]) => void;
}

export default function Playlist({
                                   items,
                                   currentIndex,
                                   playedIds = [],
                                   onSelectTrack,
                                   onRemoveTrack,
                                   onClearPlaylist,
                                   onResetPlayed,
                                   onLoadPlaylist
                                 }: PlaylistProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  
  useEffect(() => {
    if (currentIndex >= 0 && itemRefs.current[currentIndex]) {
      itemRefs.current[currentIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [currentIndex]);
  
  const handleTogglePlaylistModal = () => {
    setIsPlaylistModalOpen((prev) => !prev);
  };
  
  return (
    <div
      className="flex flex-col h-full bg-theme-panel/40 border border-theme-border p-1 font-mono text-xs text-theme-text overflow-hidden">
      
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-theme-border/50 pb-1">
        <div className="font-bold text-theme-text flex items-baseline gap-2">
          <div>PLAYLIST ({items.length})</div>
          {playedIds.length > 0 && (
            <div className="text-[10px] text-theme-muted font-normal">
              ({playedIds.length}/{items.length} gespielt)
            </div>
          )}
        </div>
        
        {/* BUTTONS FÜR LISTEN, RESET UND LEEREN */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlaylistModal}
            className="text-theme-text transition text-[10px] bg-theme-bg border border-theme-border/70 hover:bg-theme-accent/20 px-1.5 py-0.5 active:scale-95 cursor-pointer"
            title="Playlisten speichern oder laden"
          >
            Listen
          </button>
          
          {playedIds.length > 0 && onResetPlayed && (
            <button
              onClick={onResetPlayed}
              className="text-theme-text transition text-[10px] bg-theme-bg border border-theme-border/70 hover:bg-theme-accent/20 px-1.5 py-0.5 active:scale-95 cursor-pointer"
              title="Alle als ungespielt markieren"
            >
              Reset
            </button>
          )}
          
          {items.length > 0 && (
            <button
              onClick={onClearPlaylist}
              className="text-red-400 hover:text-red-300 transition text-[10px] border border-red-900/60 bg-red-950/40 px-1.5 py-0.5 active:scale-95 cursor-pointer"
              title="Playlist komplett leeren"
            >
              Leeren
            </button>
          )}
        </div>
      </div>
      
      {/* TRACK LIST */}
      <div ref={containerRef} className="flex-1 min-h-0 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-theme-muted/50 italic text-center py-4">
            Playlist ist leer
          </div>
        ) : (
          items.map((item, index) => {
            const isActive = index === currentIndex;
            const isPlayed = playedIds.includes(item.id);
            const parsed = parseSongString(item.id);
            
            let statusIcon: React.ReactNode = index + 1;
            if (isActive && isPlayed) {
              statusIcon = <span className="text-theme-text font-bold">▶ ✓</span>;
            } else if (isActive) {
              statusIcon = <span className="text-theme-border font-bold">▶</span>;
            } else if (isPlayed) {
              statusIcon = <span className="text-theme-muted font-bold">✓</span>;
            }
            
            return (
              <div
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => onSelectTrack(index)}
                className={`flex items-center justify-between p-1 cursor-pointer border ${
                  isActive
                    ? 'bg-theme-accent/30 border-theme-border text-theme-text font-bold'
                    : isPlayed
                      ? 'bg-theme-bg/30 border-transparent text-theme-muted/60 opacity-70 hover:opacity-100'
                      : 'bg-theme-bg/60 border-theme-border/30 text-theme-text hover:bg-theme-accent/10'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] w-6 text-theme-text flex justify-center shrink-0 font-mono">
                    {statusIcon}
                  </span>
                  <div className="flex flex-col truncate" title={item.songName}>
                    <div className="truncate text-xs">
                      {parsed.title}
                    </div>
                    {(parsed.artist || parsed.album) && (
                      <div className="text-[9px] text-theme-muted truncate">
                        {parsed.artist && <span className="text-theme-muted">{parsed.artist}</span>}
                        {parsed.artist && parsed.album && <span> • </span>}
                        {parsed.album && <span>{parsed.album}</span>}
                      </div>
                    )}
                  </div>
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
      
      {/* MODAL */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        currentPlaylist={items}
        onLoadPlaylist={(loadedItems) => {
          onLoadPlaylist(loadedItems);
          setIsPlaylistModalOpen(false);
        }}
      />
    </div>
  );
}