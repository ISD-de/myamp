'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

export interface VisualizerRef {
  nextPreset: () => void;
  loadPreset: (presetData: any, blendTime?: number) => void;
}

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
}

export const Visualizer = forwardRef<VisualizerRef, VisualizerProps>(({ audioElement }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerInstanceRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const presetsRef = useRef<Record<string, any>>({});
  const presetKeysRef = useRef<string[]>([]);
  const currentPresetIndexRef = useRef<number>(0);
  
  // 1. Ref-Methoden für Presets
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
    },
  }));
  
  // 2. Initialisierung und Render-Loop
  useEffect(() => {
    if (!audioElement || !canvasRef.current || !containerRef.current) return;
    
    // AudioContext & Source initialisieren
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
    
    // Presets laden
    const allPresets = butterchurnPresets.getPresets();
    presetsRef.current = allPresets;
    presetKeysRef.current = Object.keys(allPresets);
    
    // Aktuelle Maße des Containers ermitteln
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;
    
    // Butterchurn Visualizer erstellen
    const visualizer = butterchurn.createVisualizer(audioCtx, canvasRef.current, {
      width,
      height,
      pixelRatio: window.devicePixelRatio || 1,
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
    
    // --- DYNAMISCHER RESIZE HANDLER ---
    const updateSize = () => {
      if (!visualizerInstanceRef.current || !containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      
      if (newWidth > 0 && newHeight > 0) {
        // Richtige Butterchurn-Methode: setRendererSize
        if (typeof visualizerInstanceRef.current.setRendererSize === 'function') {
          visualizerInstanceRef.current.setRendererSize(
            newWidth,
            newHeight,
            window.devicePixelRatio || 1
          );
        } else if (typeof visualizerInstanceRef.current.setSize === 'function') {
          visualizerInstanceRef.current.setSize(newWidth, newHeight);
        }
      }
    };
    
    // Beobachte Größenänderungen des Containers
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', updateSize);
    
    // Render-Schleife
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
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, [audioElement]);
  
  return (
    <div ref={containerRef} className="w-full h-full min-h-screen relative overflow-hidden bg-player-bg">
      <canvas
        ref={canvasRef}
        className="w-full h-full block object-cover"
      />
    </div>
  );
});

Visualizer.displayName = 'Visualizer';

export default Visualizer;