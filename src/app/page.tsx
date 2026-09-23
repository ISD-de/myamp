'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import SongLister from '@/components/SongLister/SongLister';
import PresetSelector from '@/components/VisualizerPresetsList/VisualizerPresetsList';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import Playlist, { PlaylistItem } from '@/components/Playlist/Playlist';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import type { VisualizerRef } from '@/components/Visualizer/Visualizer';
import FolderLister from '@/components/FolderLister/FolderLister';

// WICHTIG: Visualizer nur auf dem Client (ohne SSR) laden, wegen butterchurn & window-Objekt
const Visualizer = dynamic(
  () => import('@/components/Visualizer/Visualizer'),
  { ssr: false }
);

export default function Home(): React.JSX.Element {
  
  // Notfall-Fehleranzeige auf dem Handy
  const [lastError, setLastError] = useState<string | null>(null);
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setLastError(event.message);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  
  const [autoPresetEnabled, setAutoPresetEnabled] = useState<boolean>(true);
  
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [playedIds, setPlayedIds] = useState<string[]>([]);
  
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  const [showVisSettings, setShowVisSettings] = useState<boolean>(false);
  
  const visualizerRef = useRef<VisualizerRef | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement | null>(null);
  
  const currentItem =
    currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
  const currentSong = currentItem ? currentItem.songName : null;
  
  const audioSrc = currentItem
    ? `/api/stream?folder=${encodeURIComponent(
      currentItem.folderName
    )}&song=${encodeURIComponent(currentItem.songName)}`
    : null;
  
  const getSongUniqueId = (item: { folderName: string; songName: string }) => {
    return `${item.folderName}/${item.songName}`;
  };
  
  // 1. PLAYLIST VON DER SERVER-API LADEN beim Start (ohne Autoplay-Zwang)
  useEffect(() => {
    fetch('/api/playlist')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.playlist)) {
          setPlaylist(data.playlist);
          if (data.currentIndex !== undefined) setCurrentIndex(data.currentIndex);
          if (data.isShuffle !== undefined) setIsShuffle(data.isShuffle);
          if (Array.isArray(data.playedIds)) setPlayedIds(data.playedIds);
        }
      })
      .catch((err) => {
        console.warn('Fehler beim Laden der Server-Playlist:', err);
      })
      .finally(() => {
        setIsLoaded(true);
      });
  }, []);
  
  // Hilfsfunktion zum Speichern auf dem Server
  const saveToServer = (updatedData: {
    playlist?: PlaylistItem[];
    currentIndex?: number;
    isShuffle?: boolean;
    playedIds?: string[];
  }) => {
    if (!isLoaded) return;
    
    fetch('/api/playlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    }).catch((err) => {
      console.warn('Fehler beim Speichern auf dem Server:', err);
    });
  };
  
  // 2. SONG-TRACKING
  useEffect(() => {
    if (!isLoaded || !currentItem) return;
    
    const uniqueId = getSongUniqueId(currentItem);
    
    setPlayedIds((prev) => {
      if (!prev.includes(uniqueId)) {
        const updated = [...prev, uniqueId];
        saveToServer({ playedIds: updated });
        return updated;
      }
      return prev;
    });
  }, [currentIndex, isLoaded]);
  
  // 3. SERVER-PERSISTENZ BEI ÄNDERUNGEN
  useEffect(() => {
    if (!isLoaded) return;
    saveToServer({ playlist, currentIndex, isShuffle, playedIds });
  }, [playlist, currentIndex, isShuffle, playedIds, isLoaded]);
  
  // 4. AUTO VISUALIZER PRESET BEI SONGWECHSEL
  useEffect(() => {
    if (currentSong && autoPresetEnabled && visualizerRef.current) {
      visualizerRef.current.loadRandomPreset(2.0);
    }
  }, [currentSong, autoPresetEnabled]);
  
  const onSelectFolder = (folder: string) => {
    setCurrentFolder(folder);
  };
  
  const handleAddSongToPlaylist = (song: string) => {
    if (!currentFolder) return;
    
    const newItem: PlaylistItem = {
      id: `${currentFolder}/${song}`,
      folderName: currentFolder,
      songName: song
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
      id: `${currentFolder}/${song}`,
      folderName: currentFolder,
      songName: song
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
    
    setPlayedIds((prev) => {
      const updated = prev.filter((playedId) => playedId !== id);
      saveToServer({ playedIds: updated });
      return updated;
    });
  };
  
  const handleClearPlaylist = () => {
    setPlaylist([]);
    setCurrentIndex(-1);
    setPlayedIds([]);
    saveToServer({ playlist: [], currentIndex: -1, isShuffle: false, playedIds: [] });
  };
  
  const handleToggleShuffle = () => {
    setIsShuffle((prev) => {
      const nextShuffle = !prev;
      let newPlayed = playedIds;
      if (nextShuffle && currentItem) {
        newPlayed = [getSongUniqueId(currentItem)];
        setPlayedIds(newPlayed);
      } else {
        setPlayedIds([]);
        newPlayed = [];
      }
      saveToServer({ isShuffle: nextShuffle, playedIds: newPlayed });
      return nextShuffle;
    });
  };
  
  const handleNextSong = () => {
    if (playlist.length === 0) return;
    
    setCurrentIndex((prevIdx) => {
      if (!isShuffle) {
        return (prevIdx + 1) % playlist.length;
      }
      
      let unplayedItems = playlist.filter(
        (item) => !playedIds.includes(getSongUniqueId(item))
      );
      
      if (unplayedItems.length === 0) {
        const currentUniqueId =
          prevIdx >= 0 && prevIdx < playlist.length
            ? getSongUniqueId(playlist[prevIdx])
            : null;
        
        unplayedItems = playlist.filter(
          (item) => getSongUniqueId(item) !== currentUniqueId
        );
        
        if (unplayedItems.length === 0) unplayedItems = playlist;
        
        const resetIds = currentUniqueId ? [currentUniqueId] : [];
        setPlayedIds(resetIds);
        saveToServer({ playedIds: resetIds });
      }
      
      const randomItem =
        unplayedItems[Math.floor(Math.random() * unplayedItems.length)];
      const newIdx = playlist.findIndex((item) => item.id === randomItem.id);
      
      return newIdx !== -1 ? newIdx : 0;
    });
  };
  
  const handlePrevSong = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : playlist.length - 1));
  };
  
  const handleSelectTrackFromPlaylist = (index: number) => {
    setCurrentIndex(index);
  };
  
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
      document.exitFullscreen().then();
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
    <main
      className="relative min-h-screen w-full bg-theme-bg text-theme-text font-mono overflow-hidden transition-colors duration-300 pointer-events-auto">
      {/* VISUALIZER BACKGROUND */}
      <div
        ref={visualizerContainerRef}
        className="fixed inset-0 z-0 w-full pointer-events-none"
      >
        {audioElement && audioContext && sourceNode && (
          <Visualizer
            ref={visualizerRef}
            audioElement={audioElement}
            audioContext={audioContext}
            sourceNode={sourceNode}
          />
        )}
      </div>
      
      {/* FLOATING PLAYER & CONTROL PANELS */}
      <div className="relative z-10 p-2 flex flex-col gap-2 pointer-events-auto">
        <div className="w-full md:w-125 flex flex-col gap-1.5">
          {/* MAIN PLAYER CONTAINER */}
          <div
            className="bg-theme-panel/90 backdrop-blur-md border-2 border-theme-border shadow-2xl transition-colors duration-300">
            <AudioPlayer
              audioSrc={audioSrc}
              currentSong={currentSong}
              onNextSong={playlist.length > 0 ? handleNextSong : undefined}
              onPrevSong={playlist.length > 0 ? handlePrevSong : undefined}
              onOpenPlaylist={() => setIsPlaylistOpen(true)}
              isShuffle={isShuffle}
              onToggleShuffle={handleToggleShuffle}
              showVisualizerSettings={showVisSettings}
              onToggleVisualizerSettings={() => setShowVisSettings(!showVisSettings)}
              onAudioElementReady={(node, ctx, source) => {
                if (node && ctx && source) {
                  try {
                    source.connect(ctx.destination);
                  } catch (e) {
                    // Ignorieren falls bereits verbunden
                  }
                  
                  if (ctx.state === 'suspended') {
                    ctx.resume();
                  }
                  
                  setAudioElement(node);
                  setAudioContext(ctx);
                  setSourceNode(source);
                }
              }}
            />
          </div>
          
          {showVisSettings && (
            <div className="flex flex-col">
              {/* THEME SELECTOR BAR */}
              <div className="shadow-2xl">
                <ThemeSelector/>
              </div>
              {/* VISUALIZER PRESET CONTROLLER */}
              <div
                className="flex flex-col gap-1 border-2 border-theme-border -mt-0.5 bg-theme-panel/90 backdrop-blur-md p-1.5 shadow-2xl transition-colors duration-300">
                <div className="border-b border-theme-border/50 pb-1">
              <span className="text-xs text-theme-text font-bold uppercase tracking-wider">
                Visuals
              </span>
                </div>
                
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <PresetSelector onPresetChange={handlePresetChange}/>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setAutoPresetEnabled((prev) => !prev)}
                      className={`text-xs font-semibold px-2 py-1 border transition active:scale-95 whitespace-nowrap cursor-pointer ${
                        autoPresetEnabled
                          ? 'bg-theme-accent text-white border-theme-border shadow-sm'
                          : 'bg-black/40 text-theme-muted border-theme-border hover:text-theme-text'
                      }`}
                    >
                      🎲 Auto {autoPresetEnabled ? 'ON' : 'OFF'}
                    </button>
                    
                    <button
                      onClick={() => visualizerRef.current?.nextPreset()}
                      disabled={!currentSong}
                      className="text-theme-text text-xs font-semibold px-2 py-1 bg-black/40 hover:bg-black/60 border border-theme-border transition active:scale-95 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      🔀 Nächstes
                    </button>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </div>
      
      {/* MEDIA EXPLORER & PLAYLIST MODAL */}
      {isPlaylistOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2">
          <div
            className="bg-theme-panel border-2 border-theme-border shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden transition-colors duration-300">
            <div className="p-2 border-b border-theme-border bg-theme-bg/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-theme-text">
                <span>🎵 MEDIA EXPLORER & PLAYLIST</span>
              </div>
              <button
                onClick={() => setIsPlaylistOpen(false)}
                className="text-theme-muted hover:text-theme-text text-sm px-2 py-0.5 border border-theme-border bg-theme-panel transition active:scale-95 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-2 grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-hidden">
                <FolderLister onSelectFolder={onSelectFolder}/>
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
                  playedIds={playedIds}
                  onSelectTrack={handleSelectTrackFromPlaylist}
                  onRemoveTrack={handleRemoveFromPlaylist}
                  onClearPlaylist={handleClearPlaylist}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Rotes Fehler-Overlay falls etwas abstürzt */}
      {lastError && (
        <div className="fixed inset-x-0 top-0 z-[9999] bg-red-600 text-white p-4 text-xs font-mono shadow-2xl overflow-auto max-h-40">
          <div className="font-bold">⚠️ CRASH ERKANNT:</div>
          <div>{lastError}</div>
          <button
            onClick={() => setLastError(null)}
            className="mt-2 bg-black text-white px-2 py-1 border border-white text-xs cursor-pointer"
          >
            Schließen
          </button>
        </div>
      )}
    </main>
  );
}