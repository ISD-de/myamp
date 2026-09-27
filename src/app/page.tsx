'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import PresetSelector from '@/components/Visualizer/VisualizerPresetsList/VisualizerPresetsList';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import {useHome} from '@/hooks/Main/useHome';
import Catalog from '@/components/Catalog/Catalog';
import PlayerButton from '@/components/atoms/PlayerButton/PlayerButton';
import ZoomControl from '@/components/atoms/ZoomControl/ZoomControl';
import SettingsModal from '@/components/SettingsModal/SettingsModal';

// WICHTIG: Visualizer nur auf dem Client (ohne SSR) laden, wegen butterchurn & window-Objekt
const Visualizer = dynamic(
  () => import('@/components/Visualizer/Visualizer'),
  {ssr: false}
);

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
    handleToggleShuffle,
    handleNextSong,
    handlePrevSong,
    handleSelectTrackFromPlaylist,
    handlePresetChange,
    setAudioElement,
    setAudioContext,
    setSourceNode,
    inactivityDelay,
    handleInactivityDelayChange
  } = useHome();
  
  return (
    <main
      className="relative h-screen w-full bg-theme-bg text-theme-text font-mono overflow-hidden pointer-events-auto">
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
          {/* Hier h-full und flex flex-col ergänzt, damit die Kinder wachsen können */}
          <div className="flex flex-col h-full">
            {/* MAIN PLAYER CONTAINER (wächst automatisch nach Inhalt) */}
            <div
              className="bg-theme-panel/90 backdrop-blur-md border-2 border-theme-border shrink-0">
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
            
            {isPlaylistOpen && <Catalog onSelectFolder={onSelectFolder} folderName={currentFolder}
                                        onSelectSong={handleAddSongToPlaylist}
                                        onAddAlbumToPlaylist={handleAddAlbumToPlaylist}
                                        items={playlist}
                                        currentIndex={currentIndex}
                                        playedIds={playedIds}
                                        onSelectTrack={handleSelectTrackFromPlaylist}
                                        onRemoveTrack={handleRemoveFromPlaylist}
                                        onClearPlaylist={handleClearPlaylist}/>}
            
            {showVisSettings && (
              <SettingsModal
                isOpen={showVisSettings}
                onClose={() => setShowVisSettings(false)}
                onPresetChange={handlePresetChange}
                autoPresetEnabled={autoPresetEnabled}
                setAutoPresetEnabled={setAutoPresetEnabled}
                onNextPreset={() => visualizerRef.current?.nextPreset()}
                isSongActive={!!currentSong}
                inactivityDelay={inactivityDelay}
                onInactivityDelayChange={handleInactivityDelayChange}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Rotes Fehler-Overlay falls etwas abstürzt */}
      {lastError && (
        <div
          className="fixed inset-x-0 top-0 z-9999 bg-red-600 text-white p-4 text-xs font-mono shadow-2xl overflow-auto max-h-40">
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