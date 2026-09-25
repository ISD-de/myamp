'use client';

import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {useVisualizer} from '@/hooks/Visualizer/useVisualizer';

export interface VisualizerRef {
  nextPreset: () => void;
  loadPreset: (presetData: any, blendTime?: number) => void;
  loadRandomPreset: (blendTime?: number) => void;
}

interface VisualizerProps {
  audioElement: HTMLAudioElement | null;
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
}

export const Visualizer = forwardRef<VisualizerRef, VisualizerProps>(
  ({ audioElement, audioContext, sourceNode }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    
    // Geschäftslogik auslagern in den Custom Hook
    const { nextPreset, loadPreset, loadRandomPreset } = useVisualizer({
      audioElement,
      audioContext,
      sourceNode,
      containerRef,
      canvasRef,
    });
    
    // Imperatives Interface für die Elternkomponente bereitstellen
    useImperativeHandle(ref, () => ({
      nextPreset,
      loadPreset,
      loadRandomPreset,
    }));
    
    return (
      <div ref={containerRef} className="w-full h-full min-h-screen relative overflow-hidden bg-black">
        <canvas ref={canvasRef} className="w-full h-full block object-cover" />
      </div>
    );
  }
);

Visualizer.displayName = 'Visualizer';

export default Visualizer;