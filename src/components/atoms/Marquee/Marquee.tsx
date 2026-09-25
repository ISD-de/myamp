'use client';

import React, { useEffect, useState } from 'react';

interface MarqueeProps {
  text: string;
  speed?: number; // Millisekunden pro Schritt (kleiner = schneller)
}

export const Marquee: React.FC<MarqueeProps> = ({ text, speed = 220 }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    const rawText = text || 'KEIN SONG AUSGEWÄHLT';
    // Wir bauen einen festen String mit einem klaren Trenner
    const paddedText = `   ${rawText}   ■`;
    
    // Feste Anzahl von Zeichen, die im Anzeigefenster sichtbar sein sollen
    // (Passt perfekt in die typische Winamp-Header-Breite bei Monospace)
    const windowSize = 40;
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      // String im Kreis rotieren
      const currentString =
        paddedText.substring(currentIndex) + paddedText.substring(0, currentIndex);
      
      setDisplayText(currentString.substring(0, windowSize));
      
      currentIndex = (currentIndex + 1) % paddedText.length;
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return (
    <div className="w-full flex justify-center overflow-hidden select-none bg-transparent">
      <div className="text-3xl text-[#ffffffa0] whitespace-pre">
        {displayText}
      </div>
    </div>
  );
};

export default Marquee;