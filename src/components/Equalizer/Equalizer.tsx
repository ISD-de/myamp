'use client';

import React from 'react';
import {useEqualizer} from '@/hooks/Equalizer/useEqualizer';

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
  const {
    isFlat,
    preampGain,
    pan,
    bands,
    handlePreampChange,
    handlePanChange,
    handleBandChange,
    toggleFlatMode,
  } = useEqualizer({ audioContext, sourceNode, destinationNode });
  
  return (
    <div className="bg-theme-pannel/80 border-theme-border/40 p-3 w-full font-mono text-xs select-none transition-colors duration-300">
      {/* HEADER CONTROLS */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-theme-border/60">
        <div className="flex items-center gap-2">
          {/* ON BUTTON */}
          <button
            onClick={() => toggleFlatMode(false)}
            className={`px-2.5 py-0.5 border text-[10px] font-bold transition active:scale-95 cursor-pointer ${
              !isFlat
                ? 'bg-theme-accent text-white border-theme-border shadow-sm'
                : 'bg-theme-bg text-theme-muted/60 border-theme-border/40 hover:text-theme-text'
            }`}
          >
            ON
          </button>
          
          {/* FLAT BUTTON */}
          <button
            onClick={() => toggleFlatMode(true)}
            className={`px-2.5 py-0.5 border text-[10px] font-bold transition active:scale-95 cursor-pointer ${
              isFlat
                ? 'bg-theme-accent text-white border-theme-border shadow-sm'
                : 'bg-theme-bg text-theme-muted/60 border-theme-border/40 hover:text-theme-text'
            }`}
          >
            FLAT
          </button>
        </div>
        
        {/* PANNER CONTROL */}
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
        <div className="absolute left-7 right-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none opacity-25 border-y border-theme-border">
          <div className="border-b border-dashed border-theme-text/40 w-full h-0" />
          <div className="border-b border-dashed border-theme-text/40 w-full h-0" />
        </div>
        
        {/* PREAMP */}
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
        
        <div className="w-px h-28 bg-theme-border/50 mx-1 z-10" />
        
        {/* BANDS */}
        {bands.map((band, i) => {
          const displayValue = isFlat ? 0 : band.gain;
          return (
            <div key={band.label} className="flex flex-col items-center gap-1 z-10">
              <span className="text-[9px] text-theme-muted h-3 font-semibold">
                {displayValue > 0 ? `+${displayValue}` : displayValue}
              </span>
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={displayValue}
                disabled={isFlat}
                onChange={(e) => handleBandChange(i, parseFloat(e.target.value))}
                className="h-28 w-2 appearance-none bg-theme-bg rounded border border-theme-border/60 cursor-pointer accent-theme-accent disabled:opacity-40 [writing-mode:vertical-lr] [direction:rtl]"
              />
              <span className="font-bold text-theme-text mt-1 text-[10px]">{band.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Equalizer;