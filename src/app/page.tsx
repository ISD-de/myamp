'use client';

import React, { useEffect, useRef, useState } from 'react';
import DirectoryScanner from '@/components/DirectoryScanner/DirectoryScanner';
import SongLister from '@/components/SongLister/SongLister';
import Visualizer, { VisualizerRef } from '@/components/Visualizer/Visualizer';
import PresetSelector from '@/components/VisualizerPresetsList/VisualizerPresetsList';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import Playlist, { PlaylistItem } from '@/components/Playlist/Playlist';

export default function Home(): React.JSX.Element {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  
  // States & Refs für die Playlist
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // States & Refs für Audio und Visualizer
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  
  const visualizerRef = useRef<VisualizerRef | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Ermittlung des aktuell aktiven Songs aus der Playlist
  const currentItem = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
  const currentSong = currentItem ? currentItem.songName : null;
  
  const audioSrc = currentItem
    ? `/api/stream?folder=${encodeURIComponent(currentItem.folderName)}&song=${encodeURIComponent(currentItem.songName)}`
    : null;
  
  // --- PLAYLIST-LOGIK ---
  
  // Ordnerauswahl im Scanner
  const onSelectFolder = (folder: string) => {
    setCurrentFolder(folder);
  };
  
  // Einzelnen Song zur Playlist hinzufügen
  const handleAddSongToPlaylist = (song: string) => {
    if (!currentFolder) return;
    
    const newItem: PlaylistItem = {
      id: `${currentFolder}-${song}-${Date.now()}-${Math.random()}`,
      folderName: currentFolder,
      songName: song,
    };
    
    setPlaylist((prev) => {
      const updated = [...prev, newItem];
      if (currentIndex === -1) setCurrentIndex(0); // Ersten Song direkt aktivieren
      return updated;
    });
  };
  
  // Ganzes Album zur Playlist hinzufügen
  const handleAddAlbumToPlaylist = (songs: string[]) => {
    if (!currentFolder) return;
    
    const newItems: PlaylistItem[] = songs.map((song) => ({
      id: `${currentFolder}-${song}-${Date.now()}-${Math.random()}`,
      folderName: currentFolder,
      songName: song,
    }));
    
    setPlaylist((prev) => {
      const updated = [...prev, ...newItems];
      if (currentIndex === -1 && updated.length > 0) setCurrentIndex(0);
      return updated;
    });
  };
  
  // Titel aus der Playlist entfernen
  const handleRemoveFromPlaylist = (id: string) => {
    setPlaylist((prev) => {
      const removeIndex = prev.findIndex((item) => item.id === id);
      if (removeIndex === -1) return prev;
      
      const updated = prev.filter((item) => item.id !== id);
      
      if (removeIndex < currentIndex) {
        setCurrentIndex((prevIdx) => prevIdx - 1);
      } else if (removeIndex === currentIndex) {
        if (updated.length === 0) {
          setCurrentIndex(-1);
        } else if (currentIndex >= updated.length) {
          setCurrentIndex(updated.length - 1);
        }
      }
      return updated;
    });
  };
  
  // Playlist komplett leeren
  const handleClearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(-1);
  };
  
  // Nächster Track (z. B. am Ende des Songs)
  const handleNextSong = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1 < playlist.length ? prev + 1 : 0));
  };
  
  // Vorheriger Track
  const handlePrevSong = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : playlist.length - 1));
  };
  
  // --- VISUALIZER & FULLSCREEN ---
  
  const handlePresetChange = (presetData: any, presetName: string) => {
    if (visualizerRef.current?.loadPreset) {
      visualizerRef.current.loadPreset(presetData, 1.5);
    }
  };
  
  const toggleFullscreen = () => {
    if (!visualizerContainerRef.current) return;
    
    if (!document.fullscreenElement) {
      visualizerContainerRef.current.requestFullscreen().catch((err) => {
        console.warn(`Fehler beim Aktivieren von Fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <main className="min-h-screen bg-background p-1 flex flex-col gap-1 font-mono">
      {/* OBERER BEREICH: Player & Visualizer */}
      <div className="flex flex-col gap-0 md:gap-1 md:flex-row items-stretch w-full">
        <div className="w-full md:w-125">
          <AudioPlayer
            audioSrc={audioSrc}
            currentSong={currentSong}
            onNextSong={handleNextSong}
            onPrevSong={handlePrevSong}
            onAudioElementReady={(node, ctx, source) => {
              if (node && node !== audioElement) {
                setAudioElement(node);
              }
              setAudioContext(ctx);
              setSourceNode(source);
            }}
          />
        </div>
        {audioElement && (
          <div
            ref={visualizerContainerRef}
            className="flex-1 flex flex-col justify-between bg-player-bg border border-player-border overflow-hidden"
          >
            <div className="flex-1 relative min-h-0 w-full overflow-hidden">
              <Visualizer ref={visualizerRef} audioElement={audioElement} />
            </div>
            <div className="flex items-center justify-between gap-0 border-t border-player-border bg-player-border">
              <PresetSelector onPresetChange={handlePresetChange} />
              <button
                onClick={() => visualizerRef.current?.nextPreset()}
                className="text-white text-xs font-semibold px-3 transition active:scale-95 whitespace-nowrap"
              >
                🔀 Preset wechseln
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* UNTERER BEREICH: Explorer, Songs & Playlist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        <DirectoryScanner onSelectFolder={onSelectFolder} />
        
        <SongLister
          folderName={currentFolder}
          onSelectSong={handleAddSongToPlaylist}
          onAddAlbumToPlaylist={handleAddAlbumToPlaylist}
        />
        
        <Playlist
          items={playlist}
          currentIndex={currentIndex}
          onSelectTrack={(index: React.SetStateAction<number>) => setCurrentIndex(index)}
          onRemoveTrack={handleRemoveFromPlaylist}
          onClearPlaylist={handleClearPlaylist}
        />
      </div>
    </main>
  );
}