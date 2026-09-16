'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface BandSetting {
  label: string;
  frequency: number;
  gain: number; // in dB (-12 bis +12)
}

// 9-Band Standard Audio Frequenzen
const DEFAULT_BANDS: BandSetting[] = [
  { label: '31Hz', frequency: 31, gain: 0 },
  { label: '63Hz', frequency: 63, gain: 0 },
  { label: '125Hz', frequency: 125, gain: 0 },
  { label: '250Hz', frequency: 250, gain: 0 },
  { label: '500Hz', frequency: 500, gain: 0 },
  { label: '1kHz', frequency: 1000, gain: 0 },
  { label: '2kHz', frequency: 2000, gain: 0 },
  { label: '4kHz', frequency: 4000, gain: 0 },
  { label: '16kHz', frequency: 16000, gain: 0 },
];

interface EqualizerProps {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  destinationNode?: AudioNode;
  className?: string;
}

export const Equalizer: React.FC<EqualizerProps> = ({
                                                      audioContext,
                                                      sourceNode,
                                                      destinationNode,
                                                      className = '',
                                                    }) => {
  const [bands, setBands] = useState<BandSetting[]>(DEFAULT_BANDS);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  
  useEffect(() => {
    if (!audioContext || !sourceNode) return;
    
    sourceNode.disconnect();
    const targetDestination = destinationNode || audioContext.destination;
    
    // 9 BiquadFilter erzeugen & konfigurieren
    const filters = DEFAULT_BANDS.map((band, index) => {
      const filter = audioContext.createBiquadFilter();
      
      if (index === 0) {
        filter.type = 'lowshelf'; // Sub-Bass & Tiefbass
      } else if (index === DEFAULT_BANDS.length - 1) {
        filter.type = 'highshelf'; // Super-Treble / Brillanz
      } else {
        filter.type = 'peaking'; // Mitten & Präsenz
        filter.Q.value = 1.4; // Etwas steilere Güte (Q) für 9 präzise Bänder
      }
      
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      return filter;
    });
    
    // Signalkette aufbauen: Source -> F1 -> F2 -> ... -> F9 -> Destination
    sourceNode.connect(filters[0]);
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }
    filters[filters.length - 1].connect(targetDestination);
    
    filterNodesRef.current = filters;
    
    return () => {
      filters.forEach((f) => f.disconnect());
      try {
        sourceNode.disconnect();
        sourceNode.connect(targetDestination);
      } catch (e) {
        // Ignorieren falls getrennt
      }
    };
  }, [audioContext, sourceNode, destinationNode]);
  
  const handleGainChange = (index: number, newGain: number) => {
    const updatedBands = [...bands];
    updatedBands[index].gain = newGain;
    setBands(updatedBands);
    
    if (filterNodesRef.current[index]) {
      filterNodesRef.current[index].gain.value = newGain;
    }
  };
  
  const handleReset = () => {
    const resetBands = bands.map((b) => ({ ...b, gain: 0 }));
    setBands(resetBands);
    filterNodesRef.current.forEach((filter) => {
      filter.gain.value = 0;
    });
  };
  
  return (
    <div className={`border border-slate-700 p-4 bg-slate-800/90 rounded-xl flex flex-col gap-3 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-200">🎚️ 9-Band Equalizer</h3>
        <button
          onClick={handleReset}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded text-slate-300 transition active:scale-95"
        >
          Reset (0 dB)
        </button>
      </div>
      
      {/* 9 Vertikale Regler */}
      <div className="grid grid-cols-9 gap-1 pt-2">
        {bands.map((band, i) => (
          <div key={band.label} className="flex flex-col items-center gap-2">
            <span className="text-[9px] text-slate-400 font-mono">
              {band.gain > 0 ? `+${band.gain}` : band.gain}
            </span>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.5"
              value={band.gain}
              onChange={(e) => handleGainChange(i, parseFloat(e.target.value))}
              className="h-28 w-2 accent-purple-500 bg-slate-700 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
            />
            <span className="text-[10px] font-medium text-slate-300 truncate max-w-full">
              {band.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Equalizer;