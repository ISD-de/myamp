'use client';

import React from 'react';
import Marquee2D from '@/components/atoms/Marquee/Marquee2D';
import Equalizer from '@/components/Equalizer/Equalizer';
import {useAudioPlayer} from '@/hooks/AudioPlayer/useAudioPlayer';
import PlayerButton from '@/components/ui/PlayerButton/PlayerButton';
import MarqueeBottom from '@/components/atoms/Marquee/MarquueBottom';

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
                                                          onAudioElementReady
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
    setDuration
  } = useAudioPlayer({
    audioSrc,
    currentSong,
    onNextSong,
    onAudioElementReady
  });
  
  return (
    <>
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
              message: audioElement.error?.message
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
            <div className="flex items-center flex-wrap justify-between gap-1.5">
                <PlayerButton onClick={onPrevSong} disabled={!onPrevSong}>⏮</PlayerButton>
                <PlayerButton onClick={togglePlay} isActive={isPlaying} disabled={!audioSrc}>{isPlaying
                  ? '▶'
                  : '❚❚'}</PlayerButton>
                <PlayerButton onClick={onNextSong} disabled={!onNextSong}>⏭</PlayerButton>
                {onToggleShuffle &&
                  <PlayerButton onClick={onToggleShuffle} isActive={isShuffle}>{isShuffle
                    ? '312'
                    : '123'}</PlayerButton>}
                {onOpenPlaylist && <PlayerButton onClick={onOpenPlaylist}>≡♪</PlayerButton>}
            </div>
            
            <div>
              <PlayerButton onClick={() => setShowEq(!showEq)} isActive={showEq}>EQ</PlayerButton>
              {onToggleVisualizerSettings &&
                <PlayerButton onClick={onToggleVisualizerSettings}
                              isActive={showVisualizerSettings}>⚙️</PlayerButton>}
            </div>
            
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <PlayerButton onClick={toggleMute}>{isMuted ? '🔇' : '🔊'}</PlayerButton>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1 bg-theme-bg appearance-none cursor-pointer accent-theme-accent border-0"
                />
              </div>
            </div>
          </div>
        </div>
        {showEq && (
          <div className="border-t border-theme-border/80">
            <Equalizer audioContext={audioContextRef.current} sourceNode={sourceNodeRef.current}/>
          </div>
        )}
        <MarqueeBottom extractedTitle={extractedTitle}/>
      </div>
    </>
  );
};

export default AudioPlayer;