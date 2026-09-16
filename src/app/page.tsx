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
  
  const audioSrc =
    currentFolder && currentSong
      ? `/api/stream?folder=${encodeURIComponent(currentFolder)}&song=${encodeURIComponent(currentSong)}`
      : null;
  
  return (
    <main className="min-h-screen bg-background p-4 flex flex-col gap-6">
      {/* OBERER BEREICH: Player/EQ (Links) + Visualizer (Rechts) */}
      <div className="flex flex-col md:flex-row gap-4 items-astretch w-full">
        
        {/* Linke Spalte: Player + Equalizer */}
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
        
        {/* Rechte Spalte: Visualizer füllt die restliche Breite & exakte Höhe aus */}
        {audioElement && (
          <div className="flex-1 flex flex-col justify-between bg-black/40 border border-slate-800 rounded-lg p-2 gap-2 overflow-hidden">
            
            {/* Visualizer-Canvas Bereich (dehnt sich vertikal voll aus) */}
            <div className="flex-1 relative min-h-0 w-full overflow-hidden rounded">
              <Visualizer
                ref={visualizerRef}
                audioElement={audioElement}
              />
            </div>
            
            {/* Visualizer Steuerung / Presets am unteren Rand */}
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
              <PresetSelector onPresetChange={handlePresetChange} />
              <button
                onClick={() => visualizerRef.current?.nextPreset()}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition active:scale-95 whitespace-nowrap"
              >
                🔀 Preset wechseln
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* UNTERER BEREICH: Ordner & Songs */}
      <div className="flex flex-row gap-4">
        <div className="w-1/2 h-96">
          <DirectoryScanner onSelectFolder={onSelectFolder} />
        </div>
        <div className="w-1/2 h-96">
          <SongLister folderName={currentFolder} onSelectSong={onSelectSong} />
        </div>
      </div>
    </main>
  );
}