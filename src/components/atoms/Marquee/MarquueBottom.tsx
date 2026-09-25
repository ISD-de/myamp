'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Marquee from '@/components/atoms/Marquee/Marquee'; // Pfad anpassen

interface BottomMarqueeProps {
  extractedTitle: string;
}

export const MarqueeBottom: React.FC<BottomMarqueeProps> = ({ extractedTitle }) => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) return null;
  
  return createPortal(
    <div className="fixed bottom-[100px] left-0 right-0 z3-9999 w-full p-2 pointer-events-auto">
      <Marquee text={extractedTitle} speed={80} />
    </div>,
    document.body
  );
};

export default MarqueeBottom;