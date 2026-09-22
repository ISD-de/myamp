'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

export interface VisualizerRef {
  nextPreset: () => void;
  loadPreset: (presetData: any, blendTime?: number) => void;
  loadRandomPreset: (blendTime?: number) => void;
}

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
  audioContext: AudioContext;
  sourceNode: MediaElementAudioSourceNode;
}

export const Visualizer = forwardRef<VisualizerRef, VisualizerProps>(
  ({ audioElement, audioContext, sourceNode }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const visualizerInstanceRef = useRef<any>(null);
    
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
      loadRandomPreset: (blendTime: number = 2.0) => {
        const keys = presetKeysRef.current;
        if (keys.length === 0 || !visualizerInstanceRef.current) return;
        
        const randomIndex = Math.floor(Math.random() * keys.length);
        currentPresetIndexRef.current = randomIndex;
        const randomKey = keys[randomIndex];
        const preset = presetsRef.current[randomKey];
        
        visualizerInstanceRef.current.loadPreset(preset, blendTime);
      },
    }));
    
    // 2. Initialisierung und Render-Loop
    useEffect(() => {
      if (!audioElement || !audioContext || !sourceNode || !canvasRef.current || !containerRef.current) {
        return;
      }
      
      // Presets laden
      const allPresets = butterchurnPresets.getPresets();
      presetsRef.current = allPresets;
      presetKeysRef.current = Object.keys(allPresets);
      
      // Maße des Containers ermitteln
      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;
      
      // Visualizer Instanz erstellen
      const visualizer = butterchurn.createVisualizer(audioContext, canvasRef.current, {
        width,
        height,
        pixelRatio: window.devicePixelRatio || 1,
      });
      
      visualizerInstanceRef.current = visualizer;
      
      // PARALLELE AUDIO-ANALYSE:
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      
      try {
        // Verbinde sourceNode mit dem Analyser
        sourceNode.connect(analyser);
        visualizer.connectAudio(analyser);
      } catch (e) {
        console.warn('Fehler beim Verbinden des Analysers:', e);
      }
      
      // Initiales Preset laden
      if (presetKeysRef.current.length > 0) {
        const initialKey = presetKeysRef.current[0];
        visualizer.loadPreset(allPresets[initialKey], 0);
      }
      
      // RESIZE HANDLER
      const updateSize = () => {
        if (!visualizerInstanceRef.current || !containerRef.current) return;
        const newWidth = containerRef.current.clientWidth;
        const newHeight = containerRef.current.clientHeight;
        
        if (newWidth > 0 && newHeight > 0) {
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
      
      const resizeObserver = new ResizeObserver(() => {
        updateSize();
      });
      resizeObserver.observe(containerRef.current);
      
      window.addEventListener('resize', updateSize);
      
      // Render-Schleife
      let animationFrameId: number;
      const render = () => {
        animationFrameId = requestAnimationFrame(render);
        visualizer.render();
      };
      
      render();
      
      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', updateSize);
        resizeObserver.disconnect();
        
        // SAFE CLEANUP: Trenne NUR den Analyser, damit die Hauptverbindung der sourceNode aktiv bleibt!
        try {
          analyser.disconnect();
        } catch (e) {
          // Ignorieren beim Unmount
        }
      };
    }, [audioElement, audioContext, sourceNode]);
    
    return (
      <div ref={containerRef} className="w-full h-full min-h-screen relative overflow-hidden bg-black">
        <canvas ref={canvasRef} className="w-full h-full block object-cover" />
      </div>
    );
  }
);

Visualizer.displayName = 'Visualizer';

export default Visualizer;