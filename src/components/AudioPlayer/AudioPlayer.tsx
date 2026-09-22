'use client';

import React, { useEffect, useRef, useState } from 'react';
import Equalizer from '@/components/AudioPlayer/Equalizer';
import * as musicMetadata from 'music-metadata-browser';

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
  onOpenPlaylist?: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
                                                          audioSrc,
                                                          currentSong,
                                                          onAudioElementReady,
                                                          onNextSong,
                                                          onPrevSong,
                                                          onOpenPlaylist,
                                                          isShuffle,
                                                          onToggleShuffle
                                                        }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Web Audio API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Web Audio States
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [sourceNode, setSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  
  // Player States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  
  const [bitrate, setBitrate] = useState<number | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  
  // Initialisierung AudioContext & SourceNode
  const handleAudioRef = (node: HTMLAudioElement | null) => {
    if (!node) return;
    
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
        onAudioElementReady(node, ctx, source);
      } catch (err) {
        console.warn('SourceNode existiert bereits:', err);
      }
    } else if (!node) {
      onAudioElementReady(null, null, null);
    }
  };
  
  // Play-State & Autoplay
  useEffect(() => {
    if (audioSrc && audioRef.current) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().then();
      }
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [audioSrc]);
  
  useEffect(() => {
    if (!audioSrc) return;
    
    const fetchMetadata = async () => {
      try {
        const metadata = await musicMetadata.fetchFromUrl(audioSrc);
        
        if (metadata.format.bitrate) {
          setBitrate(Math.round(metadata.format.bitrate / 1000));
        }
        if (metadata.format.sampleRate) {
          setSampleRate(Math.round(metadata.format.sampleRate / 1000));
        }
      } catch (err) {
        console.warn('Metadaten konnten nicht gelesen werden:', err);
      }
    };
    
    fetchMetadata();
  }, [audioSrc]);
  
  useEffect(() => {
    if (audioRef.current && audioContextRef.current && sourceNodeRef.current) {
      onAudioElementReady(
        audioRef.current,
        audioContextRef.current,
        sourceNodeRef.current
      );
    }
  }, [audioSrc]);
  
  // Steuerungshandler
  const handlePlay = () => {
    if (!audioRef.current || !audioSrc) return;
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    audioRef.current.play();
    setIsPlaying(true);
  };
  
  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };
  
  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
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
      const nextMute = !isMuted;
      audioRef.current.muted = nextMute;
      setIsMuted(nextMute);
    }
  };
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col gap-1 transition-colors duration-300">
      <div className="bg-theme-panel border-2 border-theme-border p-2 font-mono select-none text-theme-text transition-colors duration-300">
        
        {/* LCD DISPLAY PANEL */}
        <div className="bg-black/80 border border-theme-border p-2 flex flex-col justify-between h-20 relative overflow-hidden rounded-sm">
          <div className="flex items-center justify-between text-xs text-theme-muted font-bold tracking-tight">
            <div className="flex flex-col gap-0.5 text-[8px] leading-none">
              <span className={isPlaying ? 'text-theme-border font-bold' : 'text-theme-muted/40'}>▲ PLAY</span>
              <span className={!isPlaying && currentTime > 0 ? 'text-theme-accent font-bold' : 'text-theme-muted/40'}>❚❚ PAUSE</span>
            </div>
            <div className="flex-1 ml-3 overflow-hidden whitespace-nowrap text-ellipsis text-right text-theme-border font-mono tracking-wider font-bold">
              {currentSong ? currentSong.replace('.mp3', '') : 'WINAMP: NO FILE LOADED'}
            </div>
          </div>
          
          <div className="flex justify-between items-end text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-theme-border font-mono leading-none">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-theme-muted">/ {formatTime(duration)}</span>
            </div>
            <div className="flex gap-2 text-[9px] font-bold text-theme-muted">
              <span><strong className="text-theme-text">{bitrate ?? '--'}</strong> KBPS</span>
              <span><strong className="text-theme-text">{sampleRate ?? '--'}</strong> KHZ</span>
              <span className="text-theme-border">STEREO</span>
            </div>
          </div>
          
          <div className="mt-1">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioSrc}
              className="w-full h-1 bg-theme-bg appearance-none cursor-pointer accent-theme-border"
            />
          </div>
        </div>
        
        {/* VOLUME BAR */}
        <div className="flex items-center justify-between px-1 my-1.5 bg-theme-bg/60 p-1.5 border border-theme-border/50 rounded">
          <button
            onClick={toggleMute}
            className={`px-2 py-0.5 border text-xs font-bold transition active:scale-95 cursor-pointer rounded ${
              isMuted
                ? 'bg-red-950/80 text-red-400 border-red-700'
                : 'bg-theme-panel text-theme-text border-theme-border hover:bg-theme-accent/20'
            }`}
          >
            {isMuted ? '🔇 MUTE' : '🔊 VOL'}
          </button>
          <div className="flex-1 mx-3 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-theme-bg rounded appearance-none cursor-pointer accent-theme-accent"
            />
          </div>
        </div>
        
        {/* MEDIA BUTTONS & CONTROLS */}
        <div className="flex items-center justify-between pt-1 border-t border-theme-border/40">
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevSong}
              disabled={!onPrevSong || !audioSrc}
              className="w-8 h-7 bg-theme-bg hover:bg-theme-accent/30 disabled:opacity-40 text-theme-text font-bold border border-theme-border rounded active:scale-95 text-xs flex items-center justify-center transition cursor-pointer"
              title="Vorheriger Song"
            >
              ⏮
            </button>
            <button
              onClick={handlePlay}
              disabled={!audioSrc}
              className="w-8 h-7 bg-theme-bg hover:bg-theme-accent/30 disabled:opacity-40 text-theme-text font-bold border border-theme-border rounded active:scale-95 text-xs flex items-center justify-center transition cursor-pointer"
              title="Play"
            >
              ▶
            </button>
            <button
              onClick={handlePause}
              disabled={!audioSrc}
              className="w-8 h-7 bg-theme-bg hover:bg-theme-accent/30 disabled:opacity-40 text-theme-text font-bold border border-theme-border rounded active:scale-95 text-xs flex items-center justify-center transition cursor-pointer"
              title="Pause"
            >
              ❚❚
            </button>
            <button
              onClick={handleStop}
              disabled={!audioSrc}
              className="w-8 h-7 bg-theme-bg hover:bg-theme-accent/30 disabled:opacity-40 text-theme-text font-bold border border-theme-border rounded active:scale-95 text-xs flex items-center justify-center transition cursor-pointer"
              title="Stop"
            >
              ■
            </button>
            <button
              onClick={onNextSong}
              disabled={!onNextSong || !audioSrc}
              className="w-8 h-7 bg-theme-bg hover:bg-theme-accent/30 disabled:opacity-40 text-theme-text font-bold border border-theme-border rounded active:scale-95 text-xs flex items-center justify-center transition cursor-pointer"
              title="Nächster Song"
            >
              ⏭
            </button>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              className="w-7 h-7 bg-theme-bg hover:bg-theme-accent/30 text-theme-text text-xs border border-theme-border rounded flex items-center justify-center transition active:scale-95 cursor-pointer"
              title="Media Explorer & Playlist öffnen"
              onClick={onOpenPlaylist}
            >
              ⏏
            </button>
            <button
              onClick={() => setIsEqualizerOpen(!isEqualizerOpen)}
              className={`px-1.5 h-7 text-[12px] font-bold border rounded transition active:scale-95 cursor-pointer ${
                isEqualizerOpen
                  ? 'bg-theme-border text-black border-theme-border shadow-[0_0_8px_var(--theme-glow)]'
                  : 'bg-theme-bg text-theme-muted border-theme-border/50 hover:text-theme-text'
              }`}
            >
              EQ
            </button>
            <button
              type="button"
              onClick={onToggleShuffle}
              title={isShuffle ? 'Zufallswiedergabe (Shuffle ON)' : 'Reihenfolge (Shuffle OFF)'}
              className={`px-2 h-7 border text-xs font-bold rounded transition active:scale-95 cursor-pointer flex items-center justify-center ${
                isShuffle
                  ? 'bg-theme-accent text-white border-theme-accent shadow-[0_0_8px_var(--theme-glow)]'
                  : 'bg-theme-bg text-theme-muted border-theme-border/50 hover:text-theme-text'
              }`}
            >
              {isShuffle ? 'MIX' : '123'}
            </button>
          </div>
        </div>
        
        <audio
          ref={handleAudioRef}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onEnded={onNextSong}
          crossOrigin="anonymous"
          className="hidden"
        />
      </div>
      
      <div className={isEqualizerOpen ? 'block' : 'hidden'}>
        <Equalizer audioContext={audioContext} sourceNode={sourceNode} />
      </div>
    </div>
  );
};

export default AudioPlayer;