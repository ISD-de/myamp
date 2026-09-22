'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface BandSetting {
  label: string;
  frequency: number;
  gain: number;
}

const ITUNES_BANDS: BandSetting[] = [
  { label: '70', frequency: 70, gain: 3 },
  { label: '180', frequency: 180, gain: -4 },
  { label: '320', frequency: 320, gain: -6 },
  { label: '600', frequency: 600, gain: -9 },
  { label: '1K', frequency: 1000, gain: -9 },
  { label: '3K', frequency: 3000, gain: -8 },
  { label: '6K', frequency: 6000, gain: -5 },
  { label: '12K', frequency: 12000, gain: -3 },
  { label: '14K', frequency: 14000, gain: 2 },
  { label: '16K', frequency: 16000, gain: 7 }
];

interface EqualizerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  destinationNode?: AudioNode;
}

export const Equalizer: React.FC<EqualizerProps> = ({
                                                      audioContext,
                                                      sourceNode,
                                                      destinationNode
                                                    }) => {
  const [enabled, setEnabled] = useState(true);
  const [preampGain, setPreampGain] = useState(6);
  const [pan, setPan] = useState(0);
  const [bands, setBands] = useState<BandSetting[]>(ITUNES_BANDS);
  
  const preampNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  
  useEffect(() => {
    if (!audioContext || !sourceNode) return;
    
    sourceNode.disconnect();
    const targetDestination = destinationNode || audioContext.destination;
    
    const preamp = audioContext.createGain();
    preamp.gain.value = Math.pow(10, preampGain / 20);
    preampNodeRef.current = preamp;
    
    let panner: StereoPannerNode | null = null;
    if (audioContext.createStereoPanner) {
      panner = audioContext.createStereoPanner();
      panner.pan.value = pan;
      pannerNodeRef.current = panner;
    }
    
    const filters = ITUNES_BANDS.map((band, index) => {
      const filter = audioContext.createBiquadFilter();
      if (index === 0) filter.type = 'lowshelf';
      else if (index === ITUNES_BANDS.length - 1) filter.type = 'highshelf';
      else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = band.frequency;
      filter.gain.value = enabled ? band.gain : 0;
      return filter;
    });
    filterNodesRef.current = filters;
    
    let lastNode: AudioNode = sourceNode;
    lastNode.connect(preamp);
    lastNode = preamp;
    
    filters.forEach((filter) => {
      lastNode.connect(filter);
      lastNode = filter;
    });
    
    if (panner) {
      lastNode.connect(panner);
      lastNode = panner;
    }
    
    lastNode.connect(targetDestination);
    
    return () => {
      filters.forEach((f) => f.disconnect());
      preamp.disconnect();
      panner?.disconnect();
      try {
        sourceNode.disconnect();
        sourceNode.connect(targetDestination);
      } catch (e) {
        // Fallback-Abfangung
      }
    };
  }, [audioContext, sourceNode, destinationNode]);
  
  const handlePreampChange = (val: number) => {
    setPreampGain(val);
    if (preampNodeRef.current) {
      preampNodeRef.current.gain.value = Math.pow(10, val / 20);
    }
  };
  
  const handlePanChange = (val: number) => {
    setPan(val);
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.value = val;
    }
  };
  
  const handleBandChange = (index: number, newGain: number) => {
    const updated = [...bands];
    updated[index].gain = newGain;
    setBands(updated);
    
    if (enabled && filterNodesRef.current[index]) {
      filterNodesRef.current[index].gain.value = newGain;
    }
  };
  
  const toggleEnabled = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    filterNodesRef.current.forEach((filter, i) => {
      filter.gain.value = nextState ? bands[i].gain : 0;
    });
  };
  
  return (
    <div className="bg-theme-panel border-2 border-theme-border -mt-2 p-3 w-full md:max-w-137.5 font-mono text-xs text-theme-text select-none transition-colors duration-300">
      
      {/* HEADER CONTROLS (ON/OFF, PRESET, PAN) */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-theme-border/40">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEnabled}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition active:scale-95 cursor-pointer ${
              enabled
                ? 'bg-theme-accent text-white border-theme-border shadow-sm'
                : 'bg-theme-bg text-theme-muted/50 border-theme-border/40'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
          
          <div className="flex items-center bg-theme-bg border border-theme-border/50 rounded px-1.5 py-0.5 text-theme-muted font-semibold">
            <span>Flat</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-theme-muted font-bold text-[10px]">
          <span>L</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={pan}
            onChange={(e) => handlePanChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-theme-bg rounded appearance-none cursor-pointer accent-theme-accent"
          />
          <span>R</span>
        </div>
      </div>
      
      {/* SLIDERS SECTION */}
      <div className="relative flex justify-between items-center px-1 pt-2 pb-1">
        {/* BACKGROUND GRID LINES */}
        <div className="absolute left-7 right-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-25 border-y border-theme-border">
          <div className="border-b border-dashed border-theme-text/40 w-full h-0" />
          <div className="border-b border-dashed border-theme-text/40 w-full h-0" />
        </div>
        
        {/* PREAMP SLIDER */}
        <div className="flex flex-col items-center gap-1 z-10">
          <span className="text-[9px] text-theme-muted h-3 font-semibold">
            {preampGain > 0 ? `+${preampGain}` : preampGain}
          </span>
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={preampGain}
            onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
            className="h-28 w-2 appearance-none bg-theme-bg rounded border border-theme-border/60 cursor-pointer accent-theme-accent [writing-mode:vertical-lr] [direction:rtl]"
          />
          <span className="font-bold text-theme-text mt-1">PRE</span>
        </div>
        
        {/* DIVIDER */}
        <div className="w-px h-28 bg-theme-border/50 mx-1 z-10" />
        
        {/* FREQUENCY BAND SLIDERS */}
        {bands.map((band, i) => (
          <div key={band.label} className="flex flex-col items-center gap-1 z-10">
            <span className="text-[9px] text-theme-muted h-3 font-semibold">
              {band.gain > 0 ? `+${band.gain}` : band.gain}
            </span>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={enabled ? band.gain : 0}
              disabled={!enabled}
              onChange={(e) => handleBandChange(i, parseFloat(e.target.value))}
              className="h-28 w-2 appearance-none bg-theme-bg rounded border border-theme-border/60 cursor-pointer accent-theme-accent disabled:opacity-30 [writing-mode:vertical-lr] [direction:rtl]"
            />
            <span className="font-bold text-theme-text mt-1 text-[10px]">{band.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Equalizer;