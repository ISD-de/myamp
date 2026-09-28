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
      {/*
        text-shadow Erklärung für den 3D-Glow-Effekt:
        1. Schwarzer Schatten nach rechts unten (gibt den 3D-Plastik-/Präge-Look)
        2. Heller Glow-Effekt (z.B. in Akzentfarbe oder weiss) der nach außen strahlt
      */}
      <div
        className="text-4xl text-white font-bold whitespace-pre tracking-wider"
        style={{
          textShadow: `
            2px 2px 0px rgba(0, 0, 0, 0.9),
            0 0 10px rgba(255, 255, 255, 0.4),
            0 0 20px rgba(100, 150, 255, 0.2)
          `
        }}
      >
        {displayText}
      </div>
    </div>
  );
};

export default Marquee; // bzw. export default Marquee;