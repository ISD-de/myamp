'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface ZoomControlProps {
  storageKey?: string; // Damit der Zoom-Wert im localStorage gespeichert wird
  minZoom?: number;
  maxZoom?: number;
  step?: number;
}

export default function ZoomControl({
                                       storageKey = 'app-zoom-level',
                                       minZoom = 0.8,
                                       maxZoom = 2.0,
                                       step = 0.1,
                                     }: ZoomControlProps) {
  const [zoom, setZoom] = useState<number>(1);
  
  // Initialen Zoom beim Laden aus dem LocalStorage holen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedZoom = localStorage.getItem(storageKey);
      if (savedZoom) {
        const parsed = parseFloat(savedZoom);
        if (!isNaN(parsed)) {
          setZoom(parsed);
          applyZoomToBody(parsed);
        }
      }
    }
  }, [storageKey]);
  
  // Funktion zum Anwenden des Zooms auf den Body oder einen Container
  const applyZoomToBody = (newZoom: number) => {
    document.documentElement.style.setProperty('--app-zoom', newZoom.toString());
    // Alternativ direkt den Body skalieren:
    document.body.style.transform = `scale(${newZoom})`;
    document.body.style.transformOrigin = 'top left';
    // Breite anpassen, damit kein unerwünschter horizontaler Scrollbalken entsteht
    document.body.style.width = `${(100 / newZoom)}%`;
  };
  
  const handleZoomChange = useCallback((newZoom: number) => {
    const clamped = Math.max(minZoom, Math.min(maxZoom, Number(newZoom.toFixed(2))));
    setZoom(clamped);
    applyZoomToBody(clamped);
    localStorage.setItem(storageKey, clamped.toString());
  }, [minZoom, maxZoom, storageKey]);
  
  // Optional: Strg + Mausrad Support (genau wie im Browser)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? step : -step;
        handleZoomChange(zoom + delta);
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, step, handleZoomChange]);
  
  return (
    <div className="flex items-center gap-1 font-mono text-xs">
      <span className="text-theme-muted text-[10px] mr-1">ZOOM:</span>
      
      {/* 100% Button */}
      <button
        onClick={() => handleZoomChange(1.0)}
        className={`px-1.5 py-0.5 border transition cursor-pointer ${
          zoom === 1.0
            ? 'bg-theme-accent text-theme-bg border-theme-accent font-bold'
            : 'bg-theme-bg text-theme-muted border-theme-border/60 hover:border-theme-accent'
        }`}
      >
        100%
      </button>
      
      {/* 125% Button */}
      <button
        onClick={() => handleZoomChange(1.1)}
        className={`px-1.5 py-0.5 border transition cursor-pointer ${
          zoom === 1.1
            ? 'bg-theme-accent text-theme-bg border-theme-accent font-bold'
            : 'bg-theme-bg text-theme-muted border-theme-border/60 hover:border-theme-accent'
        }`}
      >
        110%
      </button>
      
      {/* 150% Button */}
      <button
        onClick={() => handleZoomChange(1.25)}
        className={`px-1.5 py-0.5 border transition cursor-pointer ${
          zoom === 1.25
            ? 'bg-theme-accent text-theme-bg border-theme-accent font-bold'
            : 'bg-theme-bg text-theme-muted border-theme-border/60 hover:border-theme-accent'
        }`}
      >
        125%
      </button>
    </div>
  );
}