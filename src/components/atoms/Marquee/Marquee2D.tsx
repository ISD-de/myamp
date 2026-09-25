import React, { useEffect, useRef } from 'react';

interface MarqueeCanvasProps {
  text: string;
  speed?: number; // Pixel pro Sekunde
}

export const Marquee2D: React.FC<MarqueeCanvasProps> = ({
                                                          text,
                                                          speed = 50,
                                                        }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth || 300;
    const height = 24;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    ctx.scale(dpr, dpr);
    
    // Wir teilen den String auf in den Text und das rote Symbol am Ende
    const rawTitle = text ? text : 'KEIN SONG AUSGEWÄHLT';
    const mainPart = `   ${rawTitle}   `;
    const dotPart = '■';
    
    const font = 'bold 12px monospace';
    ctx.font = font;
    
    const mainWidth = ctx.measureText(mainPart).width;
    const dotWidth = ctx.measureText(dotPart).width;
    const totalWidth = mainWidth + dotWidth;
    
    let xPos = width;
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const render = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      xPos -= speed * deltaTime;
      
      if (xPos <= -totalWidth) {
        xPos += totalWidth;
      }
      
      ctx.clearRect(0, 0, width, height);
      ctx.font = font;
      ctx.textBaseline = 'middle';
      
      const textColor = getComputedStyle(canvas).getPropertyValue('--theme-text') || '#e2e8f0';
      
      let currentX = xPos;
      while (currentX < width) {
        // 1. Haupttext zeichnen
        ctx.fillStyle = textColor;
        ctx.fillText(mainPart, currentX, height / 2);
        
        // 2. Roten Dot direkt dahinter zeichnen
        ctx.fillStyle = '#500e0e';
        ctx.fillText(dotPart, currentX + mainWidth, height / 2);
        
        currentX += totalWidth;
      }
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    animationFrameId = requestAnimationFrame(render);
    
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