'use client';

import React from 'react';
import { ThemeMode, useTheme } from '@/context/ThemeContext';

const themes: { id: ThemeMode; label: string }[] = [
  { id: 'cyberpunk', label: '💖 Cyber' },
  { id: 'matrix', label: '🟢 Matrix' },
  { id: 'synthwave', label: '🌆 Synth' },
  { id: 'dark', label: '🌑 Dark' },
];

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex items-center gap-1 bg-theme-panel p-1.5 rounded border border-theme-border">
      <span className="text-[10px] text-theme-muted font-bold px-1 uppercase tracking-wider">
        Theme:
      </span>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`text-xs px-2 py-0.5 rounded border transition active:scale-95 cursor-pointer ${
            theme === t.id
              ? 'bg-theme-accent text-white border-theme-glow font-bold shadow-sm'
              : 'bg-black/30 text-theme-muted border-transparent hover:text-theme-text'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default ThemeSelector;