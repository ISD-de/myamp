import React, { useEffect, useRef } from 'react';

interface MarqueeCanvasProps {
  text: string;
  speed?: number; // Pixel pro Sekunde (z. B. 40 bis 80)
}

export const Marquee2D: React.FC<MarqueeCanvasProps> = ({
                                                        text,
                                                        speed = 50, // Standard-Geschwindigkeit in Pixeln pro Sekunde
                                                      }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // High-DPI (Retina) Displays scharf stellen
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 300;
    const height = 24; // Feste Höhe des Laufband-Bereichs
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(dpr, dpr);
    
    const fullText = text ? `   ${text}   ■` : '   KEIN SONG AUSGEWÄHLT   ■';
    
    // Font-Eigenschaften exakt wie im Theme definieren
    const font = 'bold 12px monospace';
    ctx.font = font;
    
    // Textbreite messen
    const textWidth = ctx.measureText(fullText).width;
    let xPos = width; // Startet rechts außerhalb des Sichtfelds
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const render = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Zeitdifferenz in Sekunden
      lastTime = currentTime;
      
      // Position nach Geschwindigkeit verschieben (Pixel pro Sekunde * vergangene Zeit)
      xPos -= speed * deltaTime;
      
      // Wenn der erste Text komplett durchgelaufen ist, nahtlos zurücksetzen
      if (xPos <= -textWidth) {
        xPos += textWidth;
      }
      
      // Canvas leeren
      ctx.clearRect(0, 0, width, height);
      
      // Text zeichnen (Farbe holen wir uns idealerweise direkt aus den CSS-Variablen oder fix)
      ctx.font = font;
      // Hier nutzen wir einen neutralen Textfarb-Ton (passend zu deinem Theme)
      ctx.fillStyle = getComputedStyle(canvas).getPropertyValue('--theme-text') || '#e2e8f0';
      ctx.textBaseline = 'middle';
      
      // Den Text zweimal zeichnen für den endlosen Schleifen-Effekt
      ctx.fillText(fullText, xPos, height / 2);
      ctx.fillText(fullText, xPos + textWidth, height / 2);
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
    // Aufräumen beim Unmounten oder Textwechsel
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [text, speed]);
  
  return (
    <div className="w-full overflow-hidden select-none bg-transparent flex items-center">
      <canvas ref={canvasRef} className="block w-full" />
    </div>
  );
};

export default Marquee2D;