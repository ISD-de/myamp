'use client';

import React, { useEffect, useRef, useState } from 'react';
import DirectoryScanner from '@/components/DirectoryScanner/DirectoryScanner';
import SongLister from '@/components/SongLister/SongLister';
import Visualizer, { VisualizerRef } from '@/components/Visualizer/Visualizer';
import PresetSelector from '@/components/VisualizerPresetsList/VisualizerPresetsList';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import Playlist, { PlaylistItem } from '@/components/Playlist/Playlist';

const PLAYLIST_CACHE_KEY = 'music_player_saved_playlist';
const CURRENT_INDEX_CACHE_KEY = 'music_player_current_index';

export default function Home(): React.JSX.Element {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(false);
  
  // Auto Preset Toggle State
  const [autoPresetEnabled, setAutoPresetEnabled] = useState<boolean>(true);
  
  // States & Refs für die Playlist
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  
  // Flags für Initialisierung & Autostart
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState<boolean>(false);
  
  // States & Refs für Audio und Visualizer
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  
  const visualizerRef = useRef<VisualizerRef | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement | null>(null);
  
  const currentItem = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;
  const currentSong = currentItem ? currentItem.songName : null;
  
  const audioSrc = currentItem
    ? `/api/stream?folder=${encodeURIComponent(currentItem.folderName)}&song=${encodeURIComponent(currentItem.songName)}`
    : null;
  
  // 1. LOCALSTORAGE: Wiederherstellen & Autostart-Flag setzen
  useEffect(() => {
    try {
      const savedPlaylist = localStorage.getItem(PLAYLIST_CACHE_KEY);
      const savedIndex = localStorage.getItem(CURRENT_INDEX_CACHE_KEY);
      
      if (savedPlaylist) {
        const parsedPlaylist: PlaylistItem[] = JSON.parse(savedPlaylist);
        setPlaylist(parsedPlaylist);
        
        if (savedIndex !== null) {
          const parsedIndex = parseInt(savedIndex, 10);
          if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < parsedPlaylist.length) {
            setCurrentIndex(parsedIndex);
          } else if (parsedPlaylist.length > 0) {
            setCurrentIndex(0);
          }
        }
        
        // Autostart aktivieren, wenn eine geladene Liste Einträge hat
        if (parsedPlaylist.length > 0) {
          setShouldAutoPlay(true);
        }
      }
    } catch (error) {
      console.warn('Fehler beim Laden der gespeicherten Playlist aus dem localStorage:', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);
  
  // 2. AUTOSTART TRIGGER: Startet das Audio, sobald das Element bereit ist
  useEffect(() => {
    if (shouldAutoPlay && audioElement && audioSrc) {
      // AudioContext reaktivieren (falls vom Browser pausiert)
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      audioElement
        .play()
        .then(() => {
          setShouldAutoPlay(false); // Autostart erfolgreich ausgeführt
        })
        .catch((err) => {
          console.warn('Autoplay von Browser blockiert (Nutzerinteraktion erforderlich):', err);
          setShouldAutoPlay(false);
        });
    }
  }, [shouldAutoPlay, audioElement, audioSrc, audioContext]);
  
  // 3. LOCALSTORAGE: Speichern bei Änderungen
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(playlist));
      localStorage.setItem(CURRENT_INDEX_CACHE_KEY, currentIndex.toString());
    } catch (error) {
      console.warn('Fehler beim Speichern der Playlist im localStorage:', error);
    }
  }, [playlist, currentIndex, isInitialized]);
  
  // Bei Songwechsel automatisch ein zufälliges Preset laden
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
    localStorage.removeItem(PLAYLIST_CACHE_KEY);
    localStorage.removeItem(CURRENT_INDEX_CACHE_KEY);
  };
  
  const handleNextSong = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1 < playlist.length ? prev + 1 : 0));
  };
  
  const handlePrevSong = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : playlist.length - 1));
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
    <main className="relative min-h-screen w-full bg-black font-mono overflow-hidden">
      {/* VISUALIZER ALS VOLLFLÄCHIGER HINTERGRUND */}
      <div
        ref={visualizerContainerRef}
        className="fixed inset-0 z-0 w-full h-full pointer-events-none"
      >
        {audioElement && currentSong && (
          <Visualizer ref={visualizerRef} audioElement={audioElement} />
        )}
      </div>
      
      {/* OVERLAY-INHALT */}
      <div className="relative z-10 p-2 flex flex-col gap-2 pointer-events-auto">
        <div className="w-full md:w-125 flex flex-col gap-1">
          <div className="bg-player-bg/90 backdrop-blur-md border-2 border-player-border shadow-2xl">
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
          
          <div className="flex flex-col gap-1 border-2 border-player-border bg-player-bg/90 backdrop-blur-md p-1 shadow-2xl">
            <div className="flex items-center justify-between border-b border-player-border/50 pb-1">
              <span className="text-xs text-text-light font-bold">MEDIA LIBRARY</span>
              <button
                onClick={() => setIsPlaylistOpen(true)}
                className="text-xs bg-purple-900/80 hover:bg-purple-700 text-white font-semibold px-3 py-1 rounded border border-purple-500/50 transition active:scale-95 flex items-center gap-1.5"
              >
                <span>📂</span> Explorer & Playlist {playlist.length > 0 && `(${playlist.length})`}
              </button>
            </div>
            
            {/* PRESET STEUERUNG */}
            <div className="flex items-center justify-between gap-1 pt-0.5">
              <PresetSelector onPresetChange={handlePresetChange} />
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setAutoPresetEnabled((prev) => !prev)}
                  className={`text-xs font-semibold px-2 py-1 rounded border transition active:scale-95 whitespace-nowrap ${
                    autoPresetEnabled
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-black/40 text-gray-400 border-player-border hover:text-white'
                  }`}
                  title={
                    autoPresetEnabled
                      ? 'Auto-Preset ist AKTIV (wechselt bei jedem Song)'
                      : 'Auto-Preset ist INAKTIV (behält gewähltes Preset)'
                  }
                >
                  🎲 Auto {autoPresetEnabled ? 'ON' : 'OFF'}
                </button>
                
                <button
                  onClick={() => visualizerRef.current?.nextPreset()}
                  disabled={!currentSong}
                  className="text-white text-xs font-semibold px-2 py-1 bg-black/40 hover:bg-black/60 border border-player-border rounded transition active:scale-95 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  🔀 Nächstes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* MODALES FENSTER */}
      {isPlaylistOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-player-bg border-2 border-player-border rounded-lg shadow-2xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
            <div className="p-2 border-b border-player-border bg-background/80 flex items-center justify-between shrink-0">
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