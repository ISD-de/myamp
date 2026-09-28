'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Marquee from '@/components/atoms/Marquee/Marquee'; // Pfad anpassen

interface BottomMarqueeProps {
  extractedTitle: string;
}

export const MarqueeBottom: React.FC<BottomMarqueeProps> = ({ extractedTitle }) => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Timer-Logik für die 5-Sekunden-Anzeige & sanftes Ein-/Ausblenden
  useEffect(() => {
    if (!extractedTitle) return;
    
    // 1. Element ins DOM holen und sichtbar schalten (Fade-in)
    setShouldRender(true);
    // Ein kleiner Timeout, damit der Browser den Initial-State (opacity-0) registriert
    // und die Transition von 0 auf 1 greift
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    // 2. Timer für den Start des Ausblendens nach 5 Sekunden
    const hideTimer = setTimeout(() => {
      setIsVisible(false); // Startet das Ausblenden (Opacity -> 0)
    }, 15000);
    
    // 3. Timer, der das Element nach Ende der Animation (z.B. nach 500ms) komplett aus dem DOM wirft
    const removeTimer = setTimeout(() => {
      setShouldRender(false);
    }, 15500); // 5000ms Anzeige + 500ms Fade-out-Dauer
    
    // Cleanup bei neuem Titel / Unmount
    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [extractedTitle]);
  
  if (!mounted || !shouldRender) return null;
  
  return createPortal(
    <div
      className={`fixed bottom-25 left-0 right-0 z-9999 w-full p-2 pointer-events-auto transition-opacity duration-1000 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Marquee text={extractedTitle} speed={80} />
    </div>,
    document.body
  );
};

export default MarqueeBottom;