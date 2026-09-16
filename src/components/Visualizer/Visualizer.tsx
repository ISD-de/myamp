'use client';

import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

export interface VisualizerRef {
  nextPreset: () => void;
}

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
}

export interface VisualizerRef {
  nextPreset: () => void;
  loadPreset: (presetData: any, blendTime?: number) => void;
}

export const Visualizer = forwardRef<VisualizerRef, VisualizerProps>(({audioElement}, ref) => {
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
      
      visualizerInstanceRef.current.loadPreset(preset, 2.7);
    },
    loadPreset: (presetData: any, blendTime: number = 1.5) => {
      if (visualizerInstanceRef.current && presetData) {
        visualizerInstanceRef.current.loadPreset(presetData, blendTime);
      }
    }
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
      pixelRatio: window.devicePixelRatio || 1
    });
    
    visualizerInstanceRef.current = visualizer;
    if (sourceNodeRef.current) {
      visualizer.connectAudio(sourceNodeRef.current);
    }
    
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
    <div className=" overflow-hidden bg-player-bg relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;