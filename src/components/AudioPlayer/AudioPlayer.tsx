'use client';

import React, { useEffect, useRef, useState } from 'react';
import Equalizer from '@/components/AudioPlayer/Equalizer';

interface AudioPlayerProps {
  audioSrc: string | null;
  currentSong: string | null;
  onAudioElementReady: (
    node: HTMLAudioElement | null,
    audioContext: AudioContext | null,
    sourceNode: MediaElementAudioSourceNode | null
  ) => void;
  onNextSong?: () => void;
  onPrevSong?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
                                                          audioSrc,
                                                          currentSong,
                                                          onAudioElementReady,
                                                          onNextSong,
                                                          onPrevSong,
                                                        }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Web Audio API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Web Audio API States für React-Reaktivität
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  
  // Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  // Initialisiere AudioContext und SourceNode genau einmal beim Setzen der Audio-Ref
  const handleAudioRef = (node: HTMLAudioElement | null) => {
    audioRef.current = node;
    
    if (node && !sourceNodeRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      
      try {
        const source = ctx.createMediaElementSource(node);
        sourceNodeRef.current = source;
        
        setAudioContext(ctx);
        setSourceNode(source);
        
        // Elternkomponente informieren
        onAudioElementReady(node, ctx, source);
      } catch (err) {
        console.warn('SourceNode existiert bereits:', err);
      }
    } else if (!node) {
      onAudioElementReady(null, null, null);
    }
  };
  
  // Play-State verwalten & Autoplay
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      // AudioContext reaktivieren (falls vom Browser suspended)
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.log('Autoplay blockiert:', err);
          setIsPlaying(false);
        });
    }
  }, [audioSrc]);
  
  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) return;
    
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="border border-slate-700 p-4 bg-slate-800/80 backdrop-blur-md rounded-xl flex flex-col gap-3 shadow-lg">
      {/* Track Info */}
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-purple-400 truncate">
          🎵 <span className="text-white font-semibold">{currentSong || 'Kein Song ausgewählt'}</span>
        </p>
        <span className="text-xs text-slate-400 font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      
      {/* Progress Bar */}
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        disabled={!audioSrc}
        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
      
      {/* Control Buttons */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevSong}
            disabled={!onPrevSong || !audioSrc}
            className="p-2 text-slate-300 hover:text-white disabled:opacity-30 transition active:scale-95"
            title="Vorheriger Song"
          >
            ⏮️
          </button>
          
          <button
            onClick={togglePlay}
            disabled={!audioSrc}
            className="bg-purple-600 hover:bg-purple-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow transition active:scale-95"
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <button
            onClick={onNextSong}
            disabled={!onNextSong || !audioSrc}
            className="p-2 text-slate-300 hover:text-white disabled:opacity-30 transition active:scale-95"
            title="Nächster Song"
          >
            ⏭️
          </button>
        </div>
        
        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-sm text-slate-400 hover:text-white">
            {isMuted || volume === 0 ? '🔇' : '🔊'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>
      
      {/* Equalizer erhält Props direkt aus dem internen State */}
      <Equalizer audioContext={audioContext} sourceNode={sourceNode} />
      
      {/* Unsichtbares Audio-Tag */}
      <audio
        ref={handleAudioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNextSong}
        crossOrigin="anonymous"
        className="hidden"
      />
    </div>
  );
};

export default AudioPlayer;