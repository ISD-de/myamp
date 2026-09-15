'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
}

export interface VisualizerRef {
  nextPreset: () => void;
}

const Visualizer = forwardRef<VisualizerRef, VisualizerProps>(({ audioElement }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visualizerRef = useRef<any>(null);
  const presetsRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  
  const loadNextPreset = () => {
    if (!visualizerRef.current || !presetsRef.current) return;
    const presetNames = Object.keys(presetsRef.current);
    const randomPreset = presetsRef.current[presetNames[Math.floor(Math.random() * presetNames.length)]];
    visualizerRef.current.loadPreset(randomPreset, 2.0); // 2.0s Überblendung
  };
  
  
  useImperativeHandle(ref, () => ({
    nextPreset: loadNextPreset,
  }));
  
  useEffect(() => {
    if (!canvasRef.current || !audioElement) return;
    
    const butterchurn = require('butterchurn');
    const butterchurnPresets = require('butterchurn-presets');
    
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      
      const source = audioCtxRef.current.createMediaElementSource(audioElement);
      
      visualizerRef.current = butterchurn.default
        ? butterchurn.default.createVisualizer(audioCtxRef.current, canvasRef.current, { width: 800, height: 600 })
        : butterchurn.createVisualizer(audioCtxRef.current, canvasRef.current, { width: 800, height: 600 });
      
      visualizerRef.current.connectAudio(source);
      source.connect(audioCtxRef.current.destination);
      
      presetsRef.current = butterchurnPresets.getPresets ? butterchurnPresets.getPresets() : butterchurnPresets;
      loadNextPreset();
      
      let animationFrameId: number;
      const render = () => {
        animationFrameId = requestAnimationFrame(render);
        visualizerRef.current.render();
      };
      render();
      
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [audioElement]);
  
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[500px] bg-black rounded-lg shadow-xl"
    />
  );
});

Visualizer.displayName = 'Visualizer';
export default Visualizer;