'use client';

import React from 'react';
import Marquee2D from '@/components/atoms/Marquee/Marquee2D';
import Equalizer from '@/components/Equalizer/Equalizer';
import { useAudioPlayer } from '@/hooks/AudioPlayer/useAudioPlayer';

interface AudioPlayerProps {
  audioSrc: string | null;
  currentSong?: string | null;
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
  const {
    audioRef,
    audioContextRef,
    sourceNodeRef,
    isPlaying,
    duration,
    currentTime,
    volume,
    isMuted,
    showEq,
    setShowEq,
    bitrate,
    sampleRate,
    extractedTitle,
    togglePlay,
    handleVolumeChange,
    toggleMute,
    handleSeek,
    handleEnded,
    formatTime,
    setCurrentTime,
    setDuration,
  } = useAudioPlayer({
    audioSrc,
    currentSong,
    onNextSong,
    onAudioElementReady,
  });
  
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
          
          if (onNextSong) onNextSong();
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
          <Marquee2D text={extractedTitle} speed={50}/>
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