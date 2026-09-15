'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

export interface VisualizerRef {
  nextPreset: () => void;
}

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
}

export const Visualizer = forwardRef<VisualizerRef, VisualizerProps>(({ audioElement }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerInstanceRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const presetsRef = useRef<Record<string, any>>({});
  const presetKeysRef = useRef<string[]>([]);
  const currentPresetIndexRef = useRef<number>(0);
  
  // 1. nextPreset via Ref bereitstellen
  useImperativeHandle(ref, () => ({
    nextPreset: () => {
      const keys = presetKeysRef.current;
      if (keys.length === 0 || !visualizerInstanceRef.current) return;
      
      currentPresetIndexRef.current = (currentPresetIndexRef.current + 1) % keys.length;
      const nextKey = keys[currentPresetIndexRef.current];
      const preset = presetsRef.current[nextKey];
      
      // Blend-Zeit in Sekunden (z. B. 2.7s Übergang)
      visualizerInstanceRef.current.loadPreset(preset, 2.7);
    },
  }));
  
  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;
    
    
    
    // 2. AudioContext & Source initialisieren
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    const audioCtx = audioContextRef.current;
    
    if (!sourceNodeRef.current) {
      try {
        sourceNodeRef.current = audioCtx.createMediaElementSource(audioElement);
        sourceNodeRef.current.connect(audioCtx.destination);
      } catch (e) {
        console.warn('AudioSource bereits verbunden:', e);
      }
    }
    
    // 3. Presets laden
    const allPresets = butterchurnPresets.getPresets();
    presetsRef.current = allPresets;
    presetKeysRef.current = Object.keys(allPresets);
    
    // 4. Butterchurn Visualizer erstellen
    const width = canvasRef.current.clientWidth || 800;
    const height = canvasRef.current.clientHeight || 400;
    
    const visualizer = butterchurn.createVisualizer(audioCtx, canvasRef.current, {
      width,
      height,
      pixelRatio: window.devicePixelRatio || 1,
    });
    
    visualizerInstanceRef.current = visualizer;
    visualizer.connectAudio(sourceNodeRef.current);
    
    // Initiales Preset laden
    if (presetKeysRef.current.length > 0) {
      const initialKey = presetKeysRef.current[0];
      visualizer.loadPreset(allPresets[initialKey], 0);
    }
    
    // 5. Render-Schleife
    let animationFrameId: number;
    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      
      if (audioCtx.state === 'suspended' && !audioElement.paused) {
        audioCtx.resume();
      }
      
      visualizer.render();
    };
    
    render();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [audioElement]);
  
  return (
    <div className="w-full h-[450px] border border-slate-700 rounded-xl overflow-hidden bg-black shadow-2xl relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;