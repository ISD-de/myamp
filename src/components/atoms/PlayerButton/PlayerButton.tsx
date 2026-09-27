'use client';

import React, {ReactNode} from 'react';

export interface PlayerButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  isActive?: boolean;
}

export const PlayerButton: React.FC<PlayerButtonProps> = ({
                                                            onClick,
                                                            disabled = false,
                                                            children,
                                                            isActive = false
                                                          }) => {
  const activeStyles = isActive
    ? 'bg-theme-glow text-text border-theme-border'
    : 'bg-theme-bg text-theme-muted border-theme-border/50';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-2 py-1 bg-theme-bg border border-theme-border/70 hover:bg-theme-accent/20 text-xs font-bold transition active:scale-95 disabled:opacity-40 cursor-pointer ${activeStyles}`}
    >
      {children}
    </button>
  );
};

export default PlayerButton;