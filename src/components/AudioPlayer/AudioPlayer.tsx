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
  
  // STALE CLOSURE PREVENTION: Ref hält immer die neuste onNextSong-Referenz
  const onNextSongRef = useRef(onNextSong);
  useEffect(() => {
    onNextSongRef.current = onNextSong;
  }, [onNextSong]);
  
  // Initialisierung von AudioContext und Web Audio API Node
  const initAudioNodes = () => {
    if (!audioRef.current) return;
    
    if (!audioContextRef.current) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    
    // A) AudioContext reaktivieren
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (!sourceNodeRef.current && audioContextRef.current) {
      try {
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(
          audioRef.current
        );
        
        // B) SOUND-FIX: Signal explizit an die Lautsprecher leiten
        sourceNodeRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.warn('SourceNode existiert bereits:', err);
      }
    }
    
    if (
      onAudioElementReady &&
      audioRef.current &&
      audioContextRef.current &&
      sourceNodeRef.current
    ) {
      onAudioElementReady(
        audioRef.current,
        audioContextRef.current,
        sourceNodeRef.current
      );
    }
  };
  
  // Autoplay / Songwechsel Handling
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
  
  // Play / Pause steuern
  const togglePlay = () => {
    if (!audioRef.current || !audioSrc) return;
    
    initAudioNodes();
    
    // Reaktivieren des AudioContext bei Benutzerinteraktion
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error(e));
    }
  };
  
  // Lautstärke steuern
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
  
  // Seeking
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };
  
  // Song Ende Event-Handler
  const handleEnded = () => {
    setIsPlaying(false);
    if (onNextSongRef.current) {
      onNextSongRef.current();
    }
  };
  
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className="flex flex-col w-full font-mono text-theme-text select-none">
      {/* HIDDEN HTML5 AUDIO ELEMENT WITH ONENDED EVENT */}
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
          
          // Fehlercode 1 = MEDIA_ERR_ABORTED (Wird ausgelöst, wenn ein Track während des Ladens gewechselt wird)
          // Das ist kein echter Fehler, sondern normal bei schnellem Skip!
          if (errorCode === 1) {
            return;
          }
          
          console.warn("Fehler beim Laden des Tracks:", {
            code: errorCode,
            message: audioElement.error?.message,
            event: e
          });
          
          if (onNextSongRef.current) {
            onNextSongRef.current();
          }
        }}
        onEnded={handleEnded}
        crossOrigin="anonymous"
      />
      
      {/* MAIN AUDIO PLAYER BOARD */}
      <div className="p-3 w-full transition-colors duration-300">
        {/* SONG DISPLAY / HEADER */}
        <div className="bg-theme-bg/80 border border-theme-border/60 p-2 mb-3 flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-theme-muted">
            <span>TRACK PLAYER</span>
            <span className="font-bold text-theme-border">
              {isPlaying ? '▶ PLAYING' : '❚❚ PAUSED'}
            </span>
          </div>
          <div className="text-xs font-bold truncate text-theme-text">
            {currentSong ? currentSong.replace('.mp3', '') : 'Kein Song ausgewählt'}
          </div>
        </div>
        
        {/* PROGRESS BAR & TIMERS */}
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
        
        {/* CONTROLS */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* PLAYBACK & SHUFFLE & PLAYLIST BUTTONS */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevSong}
              disabled={!onPrevSong}
              className="px-2 py-1 bg-theme-bg border border-theme-border/70 hover:bg-theme-accent/20 text-xs font-bold transition active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Vorheriger Song"
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
              title="Nächster Song"
            >
              ⏭
            </button>
            
            {/* SHUFFLE TOGGLE */}
            {onToggleShuffle && (
              <button
                onClick={onToggleShuffle}
                className={`ml-1 px-2 py-1 text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                  isShuffle
                    ? 'bg-theme-accent text-white border-theme-border'
                    : 'bg-theme-bg text-theme-muted border-theme-border/50'
                }`}
                title="Shuffle An/Aus"
              >
                {isShuffle ? '312' : '123'}
              </button>
            )}
            
            {/* PLAYLIST MODAL BUTTON */}
            {onOpenPlaylist && (
              <button
                onClick={onOpenPlaylist}
                className="ml-1 px-2 py-1 bg-theme-bg text-theme-text border border-theme-border/70 hover:bg-theme-accent/20 text-[10px] font-bold transition active:scale-95 cursor-pointer"
                title="Playlist öffnen"
              >
                ≡♪
              </button>
            )}
            
            {/* VISUALIZATION TOGGLE BUTTON */}
            {onToggleVisualizerSettings && (
              <button
                onClick={onToggleVisualizerSettings}
                className={`ml-1 px-2 py-1 text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                  showVisualizerSettings
                    ? 'bg-theme-accent text-white border-theme-border'
                    : 'bg-theme-bg text-theme-text border-theme-border/70 hover:bg-theme-accent/20'
                }`}
                title="Visualizer Einstellungen"
              >
                📊
              </button>
            )}
          </div>
          
          {/* VOLUME & EQ TOGGLE */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-theme-bg border border-theme-border/50 px-1.5 py-0.5">
              <button
                onClick={toggleMute}
                className="text-[10px] text-theme-muted hover:text-theme-text cursor-pointer"
              >
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
      
      {/* EQUALIZER COLLAPSIBLE PANEL */}
      {showEq && (
        <div className="border-t bg-theme-bg/50">
          <Equalizer
            audioContext={audioContextRef.current}
            sourceNode={sourceNodeRef.current}
          />
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;