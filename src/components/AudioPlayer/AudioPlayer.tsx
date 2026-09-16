'use client';

import React, { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  audioSrc: string | null;
  currentSong: string | null;
  onAudioElementReady: (node: HTMLAudioElement | null) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
                                                          audioSrc,
                                                          currentSong,
                                                          onAudioElementReady,
                                                        }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Steuerung von src, load() und play() direkt im Player
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      audioRef.current.play().catch((err) =>
        console.log('Autoplay blockiert (Interaktion erforderlich):', err)
      );
    }
  }, [audioSrc]);
  
  return (
    <div className="border border-slate-700 p-4 bg-slate-800 rounded-lg flex flex-col gap-2">
      <p className="text-sm font-medium text-purple-400">
        🎵 Spielt gerade: <span className="text-white">{currentSong || 'Keine Auswahl'}</span>
      </p>
      
      <audio
        ref={(node) => {
          audioRef.current = node;
          onAudioElementReady(node);
        }}
        controls
        crossOrigin="anonymous"
        className="w-full accent-purple-500"
      >
        {audioSrc && <source src={audioSrc} type="audio/mpeg" />}
        Browser unterstützt kein Audio.
      </audio>
    </div>
  );
};

export default AudioPlayer;