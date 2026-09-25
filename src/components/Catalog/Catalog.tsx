'use client';

import React, { useState, useRef, useCallback } from 'react';
import FolderLister from '@/components/FolderLister/FolderLister';
import SongLister from '@/components/SongLister/SongLister';

interface CatalogProps {
  onSelectFolder?: (folderName: string) => void;
  
  folderName: string | null;
  onSelectSong?: (songName: string) => void;
  onAddAlbumToPlaylist?: (songs: string[]) => void;
  
  
}

export const Catalog = ({ onSelectFolder, folderName, onAddAlbumToPlaylist, onSelectSong }: CatalogProps) => {
  // States für die Breiten- und Höhen-Prozentanteile bzw. Pixel
  const [leftWidth, setLeftWidth] = useState<number>(250); // Startbreite für Folder in Pixeln
  const [topHeight, setTopHeight] = useState<number>(50);  // Start-Höhe für Container 1 in Prozent (%)
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rightColumnRef = useRef<HTMLDivElement | null>(null);
  
  // --- LOGIK: Breitenveränderung (Links vs. Rechts) ---
  const handleMouseDownX = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftWidth;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(150, Math.min(600, startWidth + deltaX)); // Min 150px, Max 600px
      setLeftWidth(newWidth);
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [leftWidth]);
  
  // --- LOGIK: Höhenveränderung (Container 1 vs. Container 2) ---
  const handleMouseDownY = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const rightColumnEl = rightColumnRef.current;
    if (!rightColumnEl) return;
    
    const totalHeight = rightColumnEl.clientHeight;
    const startTopHeightPx = (topHeight / 100) * totalHeight;
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newTopHeightPx = Math.max(50, Math.min(totalHeight - 50, startTopHeightPx + deltaY));
      const newPercentage = (newTopHeightPx / totalHeight) * 100;
      setTopHeight(newPercentage);
    };
    
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [topHeight]);
  
  return (
    <div
      ref={containerRef}
      className="bg-theme-panel/90 backdrop-blur-md border-2 border-theme-border transition-colors duration-300 -mt-0.5 w-full flex-1 flex flex-col p-1 min-h-0 select-none"
    >
      <div className="w-full h-full flex justify-between gap-1 overflow-hidden">
        
        {/* LINKER BEREICH: FolderLister */}
        <div
          className="h-full flex items-center justify-start overflow-hidden"
          style={{ width: `${leftWidth}px` }}
        >
          <div className="w-full h-full overflow-y-auto">
            <FolderLister onSelectFolder={onSelectFolder} />
          </div>
        </div>
        
        {/* DRAG HANDLE X (Breite verschieben) */}
        <div
          onMouseDown={handleMouseDownX}
          className="w-1.5 h-full bg-theme-border/40 hover:bg-theme-accent cursor-col-resize transition-colors flex items-center justify-center shrink-0"
          title="Breite anpassen"
        >
          <div className="w-0.5 h-8 bg-theme-text/30 rounded-full" />
        </div>
        
        {/* RECHTER BEREICH (Unterteilt in Container 1 und 2) */}
        <div
          ref={rightColumnRef}
          className="flex-1 h-full flex flex-col min-w-0"
        >
          {/* CONTAINER 1 (SongLister) */}
          <div
            className="w-full border border-theme-border flex flex-col bg-theme-bg/40"
            style={{ height: `${topHeight}%` }}
          >
            <div className="p-1 text-[10px] uppercase font-bold tracking-wider border-b border-theme-border/50 bg-theme-panel overflow-auto text-theme-muted">
              <SongLister
                folderName={folderName}
                onSelectSong={onSelectSong}
                onAddAlbumToPlaylist={onAddAlbumToPlaylist}
              />
            </div>
            
          </div>
          
          {/* DRAG HANDLE Y (Höhe verschieben) */}
          <div
            onMouseDown={handleMouseDownY}
            className="h-1.5 w-full bg-theme-border/40 hover:bg-theme-accent cursor-row-resize transition-colors flex items-center justify-center shrink-0 my-0.5"
            title="Höhe anpassen"
          >
            <div className="h-0.5 w-8 bg-theme-text/30 rounded-full" />
          </div>
          
          {/* CONTAINER 2 (Playlist) */}
          <div
            className="w-full border border-theme-border overflow-hidden flex flex-col bg-theme-bg/40 flex-1"
          >
            <div className="p-1 text-[10px] uppercase font-bold tracking-wider border-b border-theme-border/50 bg-theme-panel text-theme-muted">
              Playlist (Container 2)
            </div>
            <div className="flex-1 p-2 overflow-y-auto">
              {/* Hier kommt später deine Playlist rein */}
              <span className="text-xs text-theme-muted">Inhalt Playlist...</span>
            </div>
          </div>
        
        </div>
      
      </div>
    </div>
  );
};

export default Catalog;