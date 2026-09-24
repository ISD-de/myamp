import { useEffect, useRef, useState } from 'react';
import { PlaylistItem } from '@/components/Playlist/Playlist';
import type { VisualizerRef } from '@/components/ui/Visualizer/Visualizer';

export function useHome() {
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
  const [isInactive, setIsInactive] = useState<boolean>(false);
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
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
  
  // 1. Playlist vom Server laden
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
  
  // 2. Song-Tracking
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
  
  // 3. Server-Persistenz bei Änderungen
  useEffect(() => {
    if (!isLoaded) return;
    saveToServer({ playlist, currentIndex, isShuffle, playedIds });
  }, [playlist, currentIndex, isShuffle, playedIds, isLoaded]);
  
  // 4. Auto Visualizer Preset bei Songwechsel
  useEffect(() => {
    if (currentSong && autoPresetEnabled && visualizerRef.current) {
      visualizerRef.current.loadRandomPreset(2.0);
    }
  }, [currentSong, autoPresetEnabled]);
  
  // Inaktivitäts-Timer Logik
  useEffect(() => {
    if (isPlaylistOpen) {
      setIsInactive(false);
      return;
    }
    
    const resetInactivityTimer = () => {
      setIsInactive(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        setIsInactive(true);
      }, 5000);
    };
    
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('click', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
    
    resetInactivityTimer();
    
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      window.removeEventListener('mousemove', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('click', resetInactivityTimer);
      window.removeEventListener('touchstart', resetInactivityTimer);
    };
  }, [isPlaylistOpen]);
  
  const onSelectFolder = (folder: string) => {
    setCurrentFolder(folder);
  };
  
  const handleAddSongToPlaylist = (song: string) => {
    if (!currentFolder) return;
    
    const newItem: PlaylistItem = {
      id: `${currentFolder}/${song}`,
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
      id: `${currentFolder}/${song}`,
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
      let newPlayed: string[];
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
  
  const handlePresetChange = (presetData: any) => {
    if (visualizerRef.current?.loadPreset) {
      visualizerRef.current.loadPreset(presetData, 0.5);
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
  
  return {
    lastError,
    setLastError,
    currentFolder,
    isPlaylistOpen,
    setIsPlaylistOpen,
    autoPresetEnabled,
    setAutoPresetEnabled,
    isShuffle,
    playedIds,
    playlist,
    currentIndex,
    audioElement,
    audioContext,
    sourceNode,
    showVisSettings,
    setShowVisSettings,
    isInactive,
    visualizerRef,
    visualizerContainerRef,
    currentSong,
    audioSrc,
    onSelectFolder,
    handleAddSongToPlaylist,
    handleAddAlbumToPlaylist,
    handleRemoveFromPlaylist,
    handleClearPlaylist,
    handleToggleShuffle,
    handleNextSong,
    handlePrevSong,
    handleSelectTrackFromPlaylist,
    handlePresetChange,
    setAudioElement,
    setAudioContext,
    setSourceNode,
  };
}