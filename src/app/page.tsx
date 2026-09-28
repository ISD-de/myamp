'use client';

import React, {useRef} from 'react';
import dynamic from 'next/dynamic';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import {useHome} from '@/hooks/Main/useHome';
import Catalog from '@/components/Catalog/Catalog';
import SettingsModal from '@/components/SettingsModal/SettingsModal';
import {KeyboardProvider, useKeyboardShortcut} from '@/context/KeyboardContext';
import {PlaylistItem} from '@/components/Catalog/Playlist/Playlist';

const Visualizer = dynamic(
  () => import('@/components/Visualizer/Visualizer'),
  {ssr: false,loading: () => <div className="fixed inset-0 z-0 bg-theme-bg"/> }
);

function GlobalShortcuts({
                           audioSrc,
                           onNextPreset,
                           onNextSong,
                           onToggleMute,
                           hasPlaylist
                         }: {
  audioSrc: string | null;
  onNextPreset: () => void;
  onNextSong?: () => void;
  onToggleMute?: () => void;
  hasPlaylist: boolean;
}) {
  useKeyboardShortcut(
    'GlobalPlayerShortcuts',
    (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      // 1. Pfeil rechts -> Nächstes Visualizer-Preset
      if (e.key === 'ArrowRight' && audioSrc !== null) {
        e.preventDefault();
        onNextPreset();
      }
      
      // 2. Taste "n" oder "N" -> Nächster Song in der Playlist
      if ((e.key === 'n' || e.key === 'N') && hasPlaylist && onNextSong) {
        e.preventDefault();
        onNextSong();
      }
      
      // 3. Taste "m" oder "M" -> Mute umschalten
      if ((e.key === 'm' || e.key === 'M') && onToggleMute) {
        e.preventDefault();
        onToggleMute();
      }
    },
    0,
    [audioSrc, onNextPreset, onNextSong, onToggleMute, hasPlaylist]
  );
  
  return null;
}

export default function Home(): React.JSX.Element {
  const {
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
    handleResetPlayed,
    handleToggleShuffle,
    handleNextSong,
    handlePrevSong,
    handleSelectTrackFromPlaylist,
    handlePresetChange,
    setAudioElement,
    setAudioContext,
    setSourceNode,
    inactivityDelay,
    handleInactivityDelayChange,
    
    // WICHTIG: Diese 3 Setter müssen aus deinem useHome Hook exportiert sein!
    setPlayedIds,
    setPlaylist,
    setCurrentIndex
  } = useHome();
  
  // Ref für die Mute-Funktion aus dem AudioPlayer
  const toggleMuteRef = useRef<(() => void) | null>(null);
  
  const handleNextPreset = () => {
    visualizerRef.current?.nextPreset();
  };
  
  // LOGIK ZUM LADEN: Befindet sich nun INNERHALB der Home-Komponente,
  // wo sie Zugriff auf setPlayedIds, setPlaylist und setCurrentIndex hat.
  const handleLoadSavedPlaylist = (loadedItems: PlaylistItem[]) => {
    if (setPlayedIds) setPlayedIds([]);
    if (setPlaylist) setPlaylist(loadedItems);
    if (setCurrentIndex) setCurrentIndex(0);
  };
  
  return (
    <KeyboardProvider>
      <GlobalShortcuts
        audioSrc={audioSrc}
        onNextPreset={handleNextPreset}
        onNextSong={playlist.length > 0 ? handleNextSong : undefined}
        onToggleMute={() => toggleMuteRef.current?.()}
        hasPlaylist={playlist.length > 0}
      />
      
      <main className="relative h-dvh w-full bg-theme-bg text-theme-text font-mono overflow-hidden pointer-events-auto">
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
        <div
          className={`w-full h-full z-10 p-0.5 flex flex-col gap-2 pointer-events-auto transition-opacity duration-1000 ease-in-out ${
            isInactive ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full h-full z-10 p-0.5 flex flex-col gap-2 pointer-events-auto">
            <div className="flex flex-col h-full">
              <div className="bg-theme-panel/90 backdrop-blur-md border-2 border-theme-border shrink-0">
                <AudioPlayer
                  audioSrc={audioSrc}
                  currentSong={currentSong}
                  onNextSong={playlist.length > 0 ? handleNextSong : undefined}
                  onPrevSong={playlist.length > 0 ? handlePrevSong : undefined}
                  onOpenPlaylist={() => setIsPlaylistOpen(!isPlaylistOpen)}
                  isShuffle={isShuffle}
                  isPlaylistOpen={isPlaylistOpen}
                  onToggleShuffle={handleToggleShuffle}
                  showVisualizerSettings={showVisSettings}
                  onToggleVisualizerSettings={() => setShowVisSettings(!showVisSettings)}
                  onToggleMuteRef={(fn) => { toggleMuteRef.current = fn; }}
                  onAudioElementReady={(node, ctx, source) => {
                    if (node && ctx && source) {
                      try {
                        source.connect(ctx.destination);
                      } catch (e) {}
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
              
              {isPlaylistOpen && (
                <Catalog
                  onSelectFolder={onSelectFolder}
                  folderName={currentFolder}
                  onSelectSong={handleAddSongToPlaylist}
                  onAddAlbumToPlaylist={handleAddAlbumToPlaylist}
                  items={playlist}
                  currentIndex={currentIndex}
                  playedIds={playedIds}
                  onSelectTrack={handleSelectTrackFromPlaylist}
                  onRemoveTrack={handleRemoveFromPlaylist}
                  onClearPlaylist={handleClearPlaylist}
                  onResetPlayed={handleResetPlayed}
                  onLoadPlaylist={handleLoadSavedPlaylist} // WICHTIG: Funktion an Catalog übergeben!
                />
              )}
              
              {showVisSettings && (
                <SettingsModal
                  isOpen={showVisSettings}
                  onClose={() => setShowVisSettings(false)}
                  onPresetChange={handlePresetChange}
                  autoPresetEnabled={autoPresetEnabled}
                  setAutoPresetEnabled={setAutoPresetEnabled}
                  onNextPreset={handleNextPreset}
                  isSongActive={!!currentSong}
                  inactivityDelay={inactivityDelay}
                  onInactivityDelayChange={handleInactivityDelayChange}
                />
              )}
            </div>
          </div>
        </div>
        
        {lastError && (
          <div className="fixed inset-x-0 top-0 z-9999 bg-red-600 text-white p-4 text-xs font-mono shadow-2xl overflow-auto max-h-40">
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
    </KeyboardProvider>
  );
}