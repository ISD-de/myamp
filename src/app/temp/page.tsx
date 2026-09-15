'use client';

import { useState, useRef, useEffect } from 'react';
import Visualizer, {VisualizerRef} from '@/components/Visualizer/Visualizer';

export default function Home() {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // Referenz zum Visualizer für den Button-Klick
  const visualizerRef = useRef<VisualizerRef | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioSrc(URL.createObjectURL(file));
    }
  };
  
  const handleAudioRef = (node: HTMLAudioElement | null) => {
    audioRef.current = node;
    setAudioElement(node);
  };
  
  // Keyboard-Shortcut: Leertaste schaltet Preset um (sofern nicht im File-Input fokussiert)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        visualizerRef.current?.nextPreset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <main className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Audio Visualizer mit Next.js</h1>
      
      <div className="flex flex-col items-center gap-2">
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium">
          MP3-Datei auswählen
          <input
            type="file"
            accept="audio/mp3, audio/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
      
      {audioSrc && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-4">
          <audio
            ref={handleAudioRef}
            src={audioSrc}
            controls
            className="w-full"
          />
          
          {/* Button für Preset-Wechsel */}
          <button
            onClick={() => visualizerRef.current?.nextPreset()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg shadow transition active:scale-95"
          >
            🔀 Nächste Visualisierung (oder Leertaste)
          </button>
          
          <Visualizer ref={visualizerRef} audioElement={audioElement} />
        </div>
      )}
    </main>
  );
}