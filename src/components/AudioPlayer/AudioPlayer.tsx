'use client';

import React, {useEffect, useRef, useState} from 'react';
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
                                                          onPrevSong,onOpenPlaylist
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
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [bitrate, setBitrate] = useState<number | null>(null);
  const [sampleRate, setSampleRate] = useState<number | null>(null);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false)
  
  // Initialisierung AudioContext & SourceNode
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
        // Metadaten direkt aus der MP3-URL parsen
        const metadata = await musicMetadata.fetchFromUrl(audioSrc);
        
        if (metadata.format.bitrate) {
          // Bitrate von bps in kbps umrechnen (z.B. 320000 -> 320)
          setBitrate(Math.round(metadata.format.bitrate / 1000));
        }
        if (metadata.format.sampleRate) {
          // SampleRate in kHz umrechnen (z.B. 44100 -> 44)
          setSampleRate(Math.round(metadata.format.sampleRate / 1000));
        }
      } catch (err) {
        console.warn('Metadaten konnten nicht gelesen werden:', err);
      }
    };
    
    fetchMetadata();
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
    <div className="flex flex-col gap-1 ">
      <div className="bg-player-bg border-2 border-player-border p-2 font-mono select-none text-text">
        <div
          className="bg-black border border-player-border p-2 flex flex-col justify-between h-17 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-player-text-muted font-bold tracking-tight">
            <div className="flex flex-col gap-0.5 text-[8px] text-player-text-disabled leading-none">
              <span className={isPlaying ? 'text-player-text-highlight' : ''}>▲ PLAY</span>
              <span className={!isPlaying && currentTime > 0 ? 'text-player-text-highlight' : ''}>❚❚ PAUSE</span>
            </div>
            <div
              className="flex-1 ml-3 overflow-hidden whitespace-nowrap text-ellipsis text-right text-player-text-highlight font-mono">
              {currentSong ? currentSong.replace('.mp3', '') : 'WINAMP: NO FILE LOADED'}
            </div>
          </div>
          <div className="flex justify-between items-end text-[10px] text-player-text-disable">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-player-text-highlight font-mono leading-none">
                {formatTime(currentTime)}
              </span>
              <span className="text-xs text-player-text-info">/ {formatTime(duration)}</span>
            </div>
            <div className="flex gap-2 text-[9px] font-bold text-player-text-disabled">
              <span><strong className="text-player-text-highlight">{bitrate}</strong> KBPS</span>
              <span><strong className="text-player-text-highlight">{sampleRate}</strong> KHZ</span>
              <span className="text-player-text-highlight">STEREO</span>
            </div>
          </div>
          <div className="">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              disabled={!audioSrc}
              className="w-full h-1 bg-player-bg appearance-none cursor-pointer accent-player-text-highlight"
            />
          </div>
        </div>
        <div className="flex items-center justify-between px-1 mb-2 bg-player-bg p-1.5 border border-player-border">
          <button
            onClick={toggleMute}
            className={`px-2 py-0.5 border text-xs font-bold transition active:scale-95 ${
              isMuted
                ? 'bg-[#5a1c1c] text-[#ff6666] border-[#8b0000]'
                : 'bg-linear-to-b from-[#4a4e57] to-[#2b2d33] text-white border-[#5a5f6b]'
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
              className="w-full h-2 bg-player-border rounded appearance-none cursor-pointer accent-player-accent"
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-player-divider">
          <div className="flex items-center mt-1 gap-1">
            <button
              onClick={onPrevSong}
              disabled={!onPrevSong || !audioSrc}
              className="w-8 h-7 bg-linear-to-b from-[#4f535d] via-[#353840] to-[#222429] hover:from-[#5c616d] text-white font-bold border border-[#555a66] rounded shadow-inner active:border-[#111] text-xs flex items-center justify-center"
              title="Previous"
            >
              ⏮
            </button>
            <button
              onClick={handlePlay}
              disabled={!audioSrc}
              className="w-8 h-7 bg-linear-to-b from-[#4f535d] via-[#353840] to-[#222429] hover:from-[#5c616d] text-white font-bold border border-[#555a66] rounded shadow-inner active:border-[#111] text-xs flex items-center justify-center"
              title="Play"
            >
              ▶
            </button>
            <button
              onClick={handlePause}
              disabled={!audioSrc}
              className="w-8 h-7 bg-linear-to-b from-[#4f535d] via-[#353840] to-[#222429] hover:from-[#5c616d] text-white font-bold border border-[#555a66] rounded shadow-inner active:border-[#111] text-xs flex items-center justify-center"
              title="Pause"
            >
              ❚❚
            </button>
            <button
              onClick={handleStop}
              disabled={!audioSrc}
              className="w-8 h-7 bg-linear-to-b from-[#4f535d] via-[#353840] to-[#222429] hover:from-[#5c616d] text-white font-bold border border-[#555a66] rounded shadow-inner active:border-[#111] text-xs flex items-center justify-center"
              title="Stop"
            >
              ■
            </button>
            <button
              onClick={onNextSong}
              disabled={!onNextSong || !audioSrc}
              className="w-8 h-7 bg-linear-to-b from-[#4f535d] via-[#353840] to-[#222429] hover:from-[#5c616d] text-white font-bold border border-[#555a66] rounded shadow-inner active:border-[#111] text-xs flex items-center justify-center"
              title="Next"
            >
              ⏭
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="w-7 h-7 bg-linear-to-b from-[#4f535d] to-[#222429] text-white text-xs border border-[#555a66] rounded flex items-center justify-center"
              title="Media Explorer & Playlist öffnen"
              onClick={onOpenPlaylist}
            >
              ⏏
            </button>
            <button
              onClick={() => setIsEqualizerOpen(!isEqualizerOpen)}
              className={`px-1.5 h-7 text-[12px] font-bold border rounded ${
                isEqualizerOpen
                  ? 'bg-[#00ffcc] text-black border-[#00ffcc] shadow-[0_0_5px_#00ffcc]'
                  : 'bg-[#222429] text-[#777] border-[#444]'
              }`}
            >
              EQ
            </button>
            <button
              onClick={() => setIsShuffle(!isShuffle)}
              className={`px-1.5 h-7 text-[9px] font-bold border rounded ${
                isShuffle
                  ? 'bg-[#00ffcc] text-black border-[#00ffcc] shadow-[0_0_5px_#00ffcc]'
                  : 'bg-[#222429] text-[#777] border-[#444]'
              }`}
            >
              123
            </button>
            <button
              onClick={() => setIsRepeat(!isRepeat)}
              className={`px-1.5 h-7 text-[12px] font-bold border rounded ${
                isRepeat
                  ? 'bg-[#00ffcc] text-black border-[#00ffcc] shadow-[0_0_5px_#00ffcc]'
                  : 'bg-[#222429] text-[#777] border-[#444]'
              }`}
            >
              🔁
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
      <div className={isEqualizerOpen ? 'visible':'hidden'}>
      <Equalizer audioContext={audioContext} sourceNode={sourceNode}/>
      </div>
    </div>
  );
};

export default AudioPlayer;