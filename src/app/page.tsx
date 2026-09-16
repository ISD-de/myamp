'use client';

import React, { useEffect, useRef, useState } from 'react';
import DirectoryScanner from '@/components/DirectoryScanner/DirectoryScanner';
import SongLister from '@/components/SongLister/SongLister';
import Visualizer, { VisualizerRef } from '@/components/Visualizer/Visualizer';

export default function Home(): React.JSX.Element {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<string | null>(null);
  
  // State für das geladene HTMLAudioElement definieren
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visualizerRef = useRef<VisualizerRef | null>(null);
  
  const onSelectFolder = (folder: string) => {
    setCurrentFolder(folder);
    setCurrentSong(null);
  };
  
  const onSelectSong = (song: string) => {
    setCurrentSong(song);
  };
  
  const audioSrc = currentFolder && currentSong
    ? `/api/stream?folder=${encodeURIComponent(currentFolder)}&song=${encodeURIComponent(currentSong)}`
    : null;
  
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      audioRef.current.play().catch((err) => console.log('Autoplay blockiert:', err));
    }
  }, [audioSrc]);
  
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 flex flex-col gap-6">
      <h1 className="text-3xl font-bold">Audio Visualizer</h1>
      <div className="w-5/12 h-75">
        <DirectoryScanner onSelectFolder={onSelectFolder} />
      </div>
      <div className="w-5/12 h-75">
        <SongLister folderName={currentFolder} onSelectSong={onSelectSong} />
      </div>
      
      <div className="border border-border p-4 bg-brand-card rounded-lg flex flex-col gap-2">
        <p className="text-sm font-medium text-brand-accent">
          🎵 Spielt gerade: <span className="text-brand-text">{currentSong || 'Keine Auswahl'}</span>
        </p>
        
        {/* Ref-Callback setzt das Element direkt in den State und löst ein sauberes Re-Render für den Visualizer aus */}
        <audio
          ref={(node) => {
            audioRef.current = node;
            if (node && node !== audioElement) {
              setAudioElement(node);
            }
          }}
          controls
          crossOrigin="anonymous"
          className="w-full accent-brand-accent"
        >
          {audioSrc && <source src={audioSrc} type="audio/mpeg" />}
          Browser unterstützt kein Audio.
        </audio>
        
        {/* Visualizer wird erst gerendert/verbunden, wenn das audioElement bereitsteht */}
        {audioElement && (
          <div className="w-1/3 h-1/3">
          <Visualizer ref={visualizerRef} audioElement={audioElement} />
          </div>
        )}
      </div>
    </main>
  );
}