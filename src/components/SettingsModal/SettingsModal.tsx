'use client';

import React, { useEffect } from 'react';
import ZoomControl from '@/components/atoms/ZoomControl/ZoomControl';
import ThemeSelector from '@/components/ThemeSelector/ThemeSelector';
import PresetSelector from '@/components/Visualizer/VisualizerPresetsList/VisualizerPresetsList';
import PlayerButton from '@/components/atoms/PlayerButton/PlayerButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Props für die Visualizer-Steuerung
  onPresetChange: (presetName: string) => void;
  autoPresetEnabled: boolean;
  setAutoPresetEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onNextPreset: () => void;
  isSongActive: boolean;
  inactivityDelay: number;
  onInactivityDelayChange: (delay: number) => void;
}

export default function SettingsModal({
                                        isOpen,
                                        onClose,
                                        onPresetChange,
                                        autoPresetEnabled,
                                        setAutoPresetEnabled,
                                        onNextPreset,
                                        isSongActive,
                                        inactivityDelay,
                                        onInactivityDelayChange
                                      }: SettingsModalProps) {
  // Schließt das Modal, wenn die ESC-Taste gedrückt wird
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Verhindern, dass Shortcuts ausgelöst werden, wenn man in einem Input/Textarea schreibt
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (isSongActive) {
          e.preventDefault();
          onNextPreset();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNextPreset, isSongActive]);
  
  if (!isOpen) return null;
  
  return (
    // Backdrop / Hintergrund-Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose} // Klick außerhalb schließt das Modal
    >
      {/* Modal Content (Klick hier blockiert das Schließen) */}
      <div
        className="bg-theme-bg border-2 border-theme-border shadow-2xl flex flex-col w-full max-w-md text-theme-text font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between bg-theme-panel p-2 border-b-2 border-theme-border">
          <h2 className="font-bold text-sm tracking-widest text-theme-accent uppercase">
            System Settings
          </h2>
          <button
            onClick={onClose}
            className="text-theme-muted hover:text-red-400 transition font-bold px-2 py-0.5 border border-transparent hover:border-red-400 cursor-pointer"
            title="Schließen (ESC)"
          >
            ✕
          </button>
        </div>
        
        {/* MODAL BODY */}
        <div className="flex flex-col p-3 gap-4">
          
          {/* --- NEU: INAKTIVITÄTS-EINSTELLUNG --- */}
          <div className="flex flex-col gap-1 border border-theme-border/50 bg-theme-panel/40 p-2">
            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">
              Auto-Hide Steuerung (Inaktivität):
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: '1 Sek', value: 1000 },
                { label: '3 Sek', value: 3000 },
                { label: '5 Sek', value: 5000 },
                { label: '10 Sek', value: 10000 },
                { label: 'Nie', value: 99999999 },
              ].map((opt) => {
                const isActive = inactivityDelay === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onInactivityDelayChange(opt.value)}
                    className={`flex-1 py-1 text-[10px] border transition cursor-pointer ${
                      isActive
                        ? 'bg-theme-accent text-theme-bg border-theme-accent font-bold'
                        : 'bg-theme-bg text-theme-muted border-theme-border/60 hover:border-theme-accent'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* ZOOM CONTROL */}
          <div className="flex flex-col gap-1 border border-theme-border/50 bg-theme-panel/40 p-2">
            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">
              Ansicht:
            </span>
            <ZoomControl />
          </div>
          
          {/* THEME SELECTOR */}
          <div className="flex flex-col gap-1 border border-theme-border/50 bg-theme-panel/40 p-2 shadow-inner">
            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">
              Farbschema:
            </span>
            <ThemeSelector />
          </div>
          
          {/* VISUALIZER PRESET CONTROLLER */}
          <div className="flex flex-col gap-1 border border-theme-border/50 bg-theme-panel/40 p-2 shadow-inner">
            <span className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">
              Visuals:
            </span>
            <div className="flex items-center justify-between gap-1">
              <PresetSelector onPresetChange={onPresetChange} />
              
              <div className="flex items-center gap-1">
                <PlayerButton
                  onClick={() => setAutoPresetEnabled((prev) => !prev)}
                  isActive={autoPresetEnabled}
                >
                  🎲 Auto {autoPresetEnabled ? 'ON' : 'OFF'}
                </PlayerButton>
                <PlayerButton
                  onClick={onNextPreset}
                  disabled={!isSongActive}
                >
                  🔀 Nächstes
                </PlayerButton>
              </div>
            </div>
          </div>
        
        </div>
      </div>
    </div>
  );
}