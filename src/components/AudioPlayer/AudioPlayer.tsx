'use client';

import React, { useEffect, useRef, useState } from 'react';
import Equalizer from '@/components/AudioPlayer/Equalizer';

interface AudioPlayerProps {
  audioSrc: string | null;
  currentSong: string | null;
  onNextSong?: () => void;
  onPrevSong?: () => void;
  onOpenPlaylist?: () => void;
  isShuffle?: boolean;
  onToggleShuffle?: () => void;
  showVisualizerSettings?: boolean;
  onToggleVisualizerSettings?: () => void;
  onAudioElementReady?: (
    element: HTMLAudioElement,
    context: AudioContext,
    source: MediaElementAudioSourceNode
  ) => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
                                                          audioSrc,
                                                          currentSong,
                                                          onNextSong,
                                                          onPrevSong,
                                                          onOpenPlaylist,
                                                          isShuffle = false,
                                                          onToggleShuffle,
                                                          showVisualizerSettings = false,
                                                          onToggleVisualizerSettings,
                                                          onAudioElementReady,
                                                        }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showEq, setShowEq] = useState<boolean>(false);
  
  // NEU: States für dynamisch ermittelte Audio-Werte bei Songwechsel
  const [bitrate, setBitrate] = useState<string | null>(null);
  const [sampleRate, setSampleRate] = useState<string | null>(null);
  
  const onNextSongRef = useRef(onNextSong);
  useEffect(() => {
    onNextSongRef.current = onNextSong;
  }, [onNextSong]);
  
  const initAudioNodes = () => {
    if (!audioRef.current) return;
    
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (!sourceNodeRef.current && audioContextRef.current) {
      try {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
        sourceNodeRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn('SourceNode existiert bereits:', err);
      }
    }
    
    if (onAudioElementReady && audioRef.current && audioContextRef.current && sourceNodeRef.current) {
      onAudioElementReady(audioRef.current, audioContextRef.current, sourceNodeRef.current);
    }
  };
  
  // METADATEN / BITRATE BEI SONGWECHSEL BERECHNEN
  useEffect(() => {
    if (!audioSrc) {
      setBitrate(null);
      setSampleRate(null);
      return;
    }
    
    // Abtastrate aus dem aktiven AudioContext auslesen (oder Standard 44.1/48 kHz)
    if (audioContextRef.current) {
      const sr = (audioContextRef.current.sampleRate / 1000).toFixed(1);
      setSampleRate(sr);
    }
    
    // Optional: Bitrate über Dateigröße / Headerauswertung schätzen oder via fetch ermitteln
    let isCancelled = false;
    fetch(audioSrc, { method: 'HEAD' })
      .then((res) => {
        const contentLength = res.headers.get('content-length');
        // Wenn die Dateigröße und Dauer bekannt sind, lässt sich die Bitrate grob errechnen
        // Alternativ kannst du hier feste Standardwerte annehmen oder die Server-Response nutzen
        if (contentLength && duration > 0 && !isCancelled) {
          const bytes = parseInt(contentLength, 10);
          const calculatedBps = Math.round((bytes * 8) / duration / 1000);
          setBitrate(calculatedBps > 0 ? calculatedBps.toString() : '320');
        } else {
          setBitrate('320'); // Fallback
        }
      })
      .catch(() => {
        if (!isCancelled) setBitrate('320');
      });
    
    return () => {
      isCancelled = true;
    };
  }, [audioSrc, duration]);
  
  useEffect(() => {
    if (!audioSrc || !audioRef.current) return;
    
    initAudioNodes();
    
    audioRef.current.src = audioSrc;
    audioRef.current.load();
    
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.warn('Autoplay unterbunden:', error);
          setIsPlaying(false);
        });
    }
  }, [audioSrc]);
  
  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) return;
    initAudioNodes();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      setIsMuted(val === 0);
    }
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (onNextSongRef.current) onNextSongRef.current();
  };
  
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="flex flex-col w-full font-mono text-theme-text select-none">
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onError={(e) => {
          const audioElement = e.currentTarget;
          const errorCode = audioElement.error?.code;
          
          if (errorCode === 1) return;
          
          console.warn("Fehler beim Laden des Tracks:", {
            code: errorCode,
            message: audioElement.error?.message,
          });
          
          if (onNextSongRef.current) onNextSongRef.current();
        }}
        onEnded={handleEnded}
        crossOrigin="anonymous"
      />
      
      <div className="p-3 w-full transition-colors duration-300">
        {/* HEADER MIT DYNAMISCH BERECHNETER BITRATE & SAMPLERATE */}
        <div className="bg-theme-bg/80 border border-theme-border/60 p-2 mb-3 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-theme-muted">
            <div className="flex items-center gap-2">
              <span>CURRENT TRACK</span>
              {(bitrate || sampleRate) && (
                <span className="text-theme-accent font-bold tracking-tight">
                  {bitrate ? `${bitrate}kbps` : ''} {sampleRate ? `/ ${sampleRate}kHz` : ''}
                </span>
              )}
            </div>
            <span className="font-bold text-theme-border">
              {isPlaying ? '▶ PLAYING' : '❚❚ PAUSED'}
            </span>
          </div>
          <div className="text-xs font-bold truncate text-theme-text">
            {currentSong ? currentSong.replace('.mp3', '') : 'Kein Song ausgewählt'}
          </div>
        </div>
        
        <div className="flex flex-col gap-1 mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={!audioSrc}
            className="w-full h-2 bg-theme-bg appearance-none cursor-pointer accent-theme-accent disabled:opacity-30"
          />
          <div className="flex justify-between text-[10px] text-theme-muted font-bold">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevSong}
              disabled={!onPrevSong}
              className="px-2 py-1 bg-theme-bg border border-theme-border/70 hover:bg-theme-accent/20 text-xs font-bold transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              ⏮
            </button>
            <button
              onClick={togglePlay}
              disabled={!audioSrc}
              className="px-3 py-1 bg-theme-accent text-white border border-theme-border font-bold text-xs transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {isPlaying ? '▶' : '❚❚'}
            </button>
            <button
              onClick={onNextSong}
              disabled={!onNextSong}
              className="px-2 py-1 bg-theme-bg border border-theme-border/70 hover:bg-theme-accent/20 text-xs font-bold transition active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              ⏭
            </button>
            
            {onToggleShuffle && (
              <button
                onClick={onToggleShuffle}
                className={`ml-1 px-2 py-1 text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                  isShuffle
                    ? 'bg-theme-accent text-white border-theme-border'
                    : 'bg-theme-bg text-theme-muted border-theme-border/50'
                }`}
              >
                {isShuffle ? '312' : '123'}
              </button>
            )}
            
            {onOpenPlaylist && (
              <button
                onClick={onOpenPlaylist}
                className="ml-1 px-2 py-1 bg-theme-bg text-theme-text border border-theme-border/70 hover:bg-theme-accent/20 text-[10px] font-bold transition active:scale-95 cursor-pointer"
              >
                ≡♪
              </button>
            )}
            
            {onToggleVisualizerSettings && (
              <button
                onClick={onToggleVisualizerSettings}
                className={`ml-1 px-2 py-1 text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                  showVisualizerSettings
                    ? 'bg-theme-accent text-white border-theme-border'
                    : 'bg-theme-bg text-theme-text border-theme-border/70 hover:bg-theme-accent/20'
                }`}
              >
                📊
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-theme-bg border border-theme-border/50 px-1.5 py-0.5">
              <button onClick={toggleMute} className="text-[10px] text-theme-muted hover:text-theme-text cursor-pointer">
                {isMuted ? '🔇' : '🔊'}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-12 h-1.5 bg-theme-panel appearance-none cursor-pointer accent-theme-accent"
              />
            </div>
            
            <button
              onClick={() => setShowEq(!showEq)}
              className={`px-1.5 py-0.5 text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                showEq
                  ? 'bg-theme-accent text-white border-theme-border'
                  : 'bg-theme-bg text-theme-muted border-theme-border/50'
              }`}
            >
              EQ
            </button>
          </div>
        </div>
      </div>
      
      {showEq && (
        <div className="border-t bg-theme-bg/50">
          <Equalizer audioContext={audioContextRef.current} sourceNode={sourceNodeRef.current} />
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;