'use client';

import React, { useEffect, useRef, useState } from 'react';
import DirectoryScanner from '@/components/DirectoryScanner/DirectoryScanner';
import SongLister from '@/components/SongLister/SongLister';
import Visualizer, { VisualizerRef } from '@/components/Visualizer/Visualizer';
import PresetSelector from '@/components/VisualizerPresetsList/VisualizerPresetsList';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';

export default function Home(): React.JSX.Element {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  
  // States & Refs für Audio und Visualizer
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  
  const visualizerRef = useRef<VisualizerRef | null>(null);
  const visualizerContainerRef = useRef<HTMLDivElement | null>(null);
  
  const onSelectFolder = (folder: string) => {
    setCurrentFolder(folder);
    setCurrentSong(null);
  };
  
  const handlePresetChange = (presetData: any, presetName: string) => {
    if (visualizerRef.current?.loadPreset) {
      visualizerRef.current.loadPreset(presetData, 1.5);
    }
  };
  
  const onSelectSong = (song: string) => {
    setCurrentSong(song);
  };
  
  // Fullscreen Handler für Taste "F"
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
  
  // Event Listener für Tastatur-Eingaben (Taste F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorieren, wenn der Nutzer gerade in einem Suchfeld/Input tippt
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
  
  const audioSrc =
    currentFolder && currentSong
      ? `/api/stream?folder=${encodeURIComponent(currentFolder)}&song=${encodeURIComponent(currentSong)}`
      : null;
  
  return (
    <main className="min-h-screen bg-background p-1 flex flex-col">
      <div className="flex flex-col gap-0 md:gap-1 md:flex-row items-stretch w-full">
        <div className="w-full md:w-125">
          <AudioPlayer
            audioSrc={audioSrc}
            currentSong={currentSong}
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
              <Visualizer
                ref={visualizerRef}
                audioElement={audioElement}
              />
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
      <div className="flex flex-row">
        <div className="w-1/2">
          <DirectoryScanner onSelectFolder={onSelectFolder} />
        </div>
        <div className="w-1/2 -ml-0.5">
          <SongLister folderName={currentFolder} onSelectSong={onSelectSong} />
        </div>
      </div>
    </main>
  );
}