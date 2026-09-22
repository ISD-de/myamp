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
  
  // Modal-State für Media-Library / Playlist
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  
  // States & Refs für die Playlist
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // States & Refs für Audio und Visualizer
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  
  const visualizerRef = useRef<VisualizerRef | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Aktiver Song aus der Playlist
  const currentItem = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
  const currentSong = currentItem ? currentItem.songName : null;
  
  const audioSrc = currentItem
    ? `/api/stream?folder=${encodeURIComponent(currentItem.folderName)}&song=${encodeURIComponent(currentItem.songName)}`
    : null;
  
  // --- PLAYLIST-LOGIK ---
  
  const onSelectFolder = (folder: string) => {
    setCurrentFolder(folder);
  };
  
  const handleAddSongToPlaylist = (song: string) => {
    if (!currentFolder) return;
    
    const newItem: PlaylistItem = {
      id: `${currentFolder}-${song}-${Date.now()}-${Math.random()}`,
      folderName: currentFolder,
      songName: song,
    };
    
    setPlaylist((prev) => {
      const updated = [...prev, newItem];
      if (currentIndex === -1) setCurrentIndex(0);
      return updated;
    });
  };
  
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
  
  const handleClearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(-1);
  };
  
  const handleNextSong = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1 < playlist.length ? prev + 1 : 0));
  };
  
  const handlePrevSong = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : playlist.length - 1));
  };
  
  // --- FULLSCREEN LOGIK ("F") ---
  
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
      if (e.key === 'Escape' && isPlaylistOpen) {
        setIsPlaylistOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaylistOpen]);
  
  return (
    <main className="min-h-screen bg-background p-1 flex flex-col font-mono">
      {/* OBERER BEREICH: Player & Visualizer */}
      <div className="flex flex-col gap-0 md:gap-1 md:flex-row items-stretch w-full">
        <div className="w-full md:w-125 flex flex-col">
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
          
          {/* Winamp-Style Button für Playlist/Library */}
          <div className="mt-1 flex items-center justify-between border-2 border-player-border bg-player-bg p-1">
            <span className="text-xs text-text-light font-bold">MEDIA LIBRARY</span>
            <button
              onClick={() => setIsPlaylistOpen(true)}
              className="text-xs bg-purple-900/60 hover:bg-purple-700/80 text-white font-semibold px-3 py-1 rounded border border-purple-500/50 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>📂</span> Playlist & Explorer {playlist.length > 0 && `(${playlist.length})`}
            </button>
          </div>
        </div>
        
        {/* Visualizer-Container bleibt immer in voller Höhe erhalten */}
        <div
          ref={visualizerContainerRef}
          className="flex-1 flex flex-col justify-between bg-player-bg border border-player-border overflow-hidden min-h-64"
        >
          <div className="flex-1 relative min-h-0 w-full overflow-hidden bg-black">
            {/* Nur wenn ein Song geladen ist & audioElement bereitsteht, wird der Visualizer aktiv */}
            {audioElement && currentSong && (
              <Visualizer ref={visualizerRef} audioElement={audioElement} />
            )}
          </div>
          
          <div className="flex items-center justify-between gap-0 border-t border-player-border bg-player-border">
            <PresetSelector onPresetChange={handlePresetChange} />
            <button
              onClick={() => visualizerRef.current?.nextPreset()}
              disabled={!currentSong}
              className="text-white text-xs font-semibold px-3 transition active:scale-95 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔀 Preset wechseln
            </button>
          </div>
        </div>
      </div>
      
      {isPlaylistOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-player-bg border-2 border-player-border rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-2 border-b border-player-border bg-background/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-text-light">
                <span>🎵 MEDIA EXPLORER & PLAYLIST</span>
              </div>
              <button
                onClick={() => setIsPlaylistOpen(false)}
                className="text-gray-400 hover:text-white text-sm px-2 py-0.5 border border-player-border rounded bg-player-bg transition"
                title="Schließen (ESC)"
              >
                ✕ Schließen
              </button>
            </div>
            
            
            <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-hidden">
                <DirectoryScanner onSelectFolder={onSelectFolder} />
              </div>
              
              <div className="h-full overflow-hidden">
                <SongLister
                  folderName={currentFolder}
                  onSelectSong={handleAddSongToPlaylist}
                  onAddAlbumToPlaylist={handleAddAlbumToPlaylist}
                />
              </div>
              
              <div className="h-full overflow-hidden">
                <Playlist
                  items={playlist}
                  currentIndex={currentIndex}
                  onSelectTrack={(index) => setCurrentIndex(index)}
                  onRemoveTrack={handleRemoveFromPlaylist}
                  onClearPlaylist={handleClearPlaylist}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}