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
  { label: '16K', frequency: 16000, gain: 7 },
];

interface EqualizerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  destinationNode?: AudioNode;
}

export const Equalizer: React.FC<EqualizerProps> = ({
                                                      audioContext,
                                                      sourceNode,
                                                      destinationNode,
                                                    }) => {
  const [enabled, setEnabled] = useState(true);
  const [preampGain, setPreampGain] = useState(6); // Preamp in dB
  const [pan, setPan] = useState(0); // -1 (L) bis +1 (R)
  const [bands, setBands] = useState<BandSetting[]>(ITUNES_BANDS);
  
  const preampNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  
  useEffect(() => {
    if (!audioContext || !sourceNode) return;
    
    sourceNode.disconnect();
    const targetDestination = destinationNode || audioContext.destination;
    
    // 1. Preamp Node (Lautstärke-Offset)
    const preamp = audioContext.createGain();
    preamp.gain.value = Math.pow(10, preampGain / 20); // dB zu Gain Umrechnung
    preampNodeRef.current = preamp;
    
    // 2. Stereo Panner Node (L / R Balance)
    let panner: StereoPannerNode | null = null;
    if (audioContext.createStereoPanner) {
      panner = audioContext.createStereoPanner();
      panner.pan.value = pan;
      pannerNodeRef.current = panner;
    }
    
    // 3. 10 EQ Biquad Filter Nodes
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
    
    // Signalkette aufbauen: Source -> Preamp -> Filter[0..N] -> Panner -> Destination
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
      } catch (e) {}
    };
  }, [audioContext, sourceNode, destinationNode]);
  
  // Handler für Preamp
  const handlePreampChange = (val: number) => {
    setPreampGain(val);
    if (preampNodeRef.current) {
      preampNodeRef.current.gain.value = Math.pow(10, val / 20);
    }
  };
  
  // Handler für Balance (L/R)
  const handlePanChange = (val: number) => {
    setPan(val);
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.value = val;
    }
  };
  
  // Handler für Frequenzbänder
  const handleBandChange = (index: number, newGain: number) => {
    const updated = [...bands];
    updated[index].gain = newGain;
    setBands(updated);
    
    if (enabled && filterNodesRef.current[index]) {
      filterNodesRef.current[index].gain.value = newGain;
    }
  };
  
  // On/Off Toggle Switch
  const toggleEnabled = () => {
    const nextState = !enabled;
    setEnabled(nextState);
    filterNodesRef.current.forEach((filter, i) => {
      filter.gain.value = nextState ? bands[i].gain : 0;
    });
  };
  
  return (
    <div className="bg-[#18191b] border border-[#2d3035] p-3 rounded-lg shadow-2xl w-full md:max-w-137.5 font-mono text-[11px] text-[#8a8e96] select-none">
      {/* Top Header Controls (Ein/Aus, Preset Selector, L/R Panner) */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#25282d]">
        <div className="flex items-center gap-2">
          {/* Toggle Button */}
          <button
            onClick={toggleEnabled}
            className={`px-2 py-0.5 rounded border text-[10px] font-bold transition ${
              enabled
                ? 'bg-linear-to-b from-[#4a4e57] to-[#2b2d33] text-white border-[#5a5f6b] shadow-inner'
                : 'bg-[#121315] text-[#555] border-[#222]'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </button>
          
          {/* Preset Selector simulation */}
          <div className="flex items-center bg-[#121315] border border-[#2d3035] rounded px-1.5 py-0.5 text-[#a0a5b0]">
            <span>Flat</span>
          </div>
        </div>
        
        {/* L / R Balance Slider */}
        <div className="flex items-center gap-2">
          <span>L</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={pan}
            onChange={(e) => handlePanChange(parseFloat(e.target.value))}
            className="w-24 h-1 bg-[#0d0e10] rounded appearance-none cursor-pointer accent-[#b0b5c0]"
          />
          <span>R</span>
        </div>
      </div>
      
      {/* Main Equalizer Rack (Preamp + 10 Bands) */}
      <div className="relative flex justify-between items-center px-1 pt-2 pb-1">
        {/* dB Scales Background Grid (+12, 0, -12) */}
        <div className="absolute left-7 right-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-20 border-y border-[#aaa]">
          <div className="border-b border-dashed border-white w-full h-0"></div>
          <div className="border-b border-dashed border-white w-full h-0"></div>
        </div>
        
        {/* PREAMP SLIDER */}
        <div className="flex flex-col items-center gap-1 z-10">
          <span className="text-[9px] text-[#666] h-3">
            {preampGain > 0 ? `+${preampGain}` : preampGain}
          </span>
          <input
            type="range"
            min="-12"
            max="12"
            step="0.5"
            value={preampGain}
            onChange={(e) => handlePreampChange(parseFloat(e.target.value))}
            className="h-28 w-2 appearance-none bg-[#0a0b0c] rounded border border-[#2a2d33] cursor-pointer accent-[#d0d5e0] [writing-mode:vertical-lr] [direction:rtl]"
          />
          <span className="font-bold text-[#a0a5b0] mt-1">PRE</span>
        </div>
        
        <div className="w-px h-28 bg-[#282b30] mx-1 z-10" />
        
        {/* 10 FREQUENCY BANDS */}
        {bands.map((band, i) => (
          <div key={band.label} className="flex flex-col items-center gap-1 z-10">
            <span className="text-[9px] text-[#666] h-3">
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
              className="h-28 w-2 appearance-none bg-[#0a0b0c] rounded border border-[#2a2d33] cursor-pointer accent-[#d0d5e0] disabled:opacity-30 [writing-mode:vertical-lr] [direction:rtl]"
            />
            <span className="font-bold text-[#a0a5b0] mt-1 text-[10px]">{band.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Equalizer;