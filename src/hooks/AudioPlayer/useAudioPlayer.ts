import { useEffect, useRef, useState } from 'react';

export interface UseAudioPlayerOptions {
  audioSrc: string | null;
  currentSong?: string | null;
  onNextSong?: () => void;
  onAudioElementReady?: (
    element: HTMLAudioElement,
    context: AudioContext,
    source: MediaElementAudioSourceNode
  ) => void;
}

export function useAudioPlayer({
                                 audioSrc,
                                 currentSong,
                                 onNextSong,
                                 onAudioElementReady,
                               }: UseAudioPlayerOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showEq, setShowEq] = useState<boolean>(false);
  
  const [bitrate, setBitrate] = useState<string | null>(null);
  const [sampleRate, setSampleRate] = useState<string | null>(null);
  const [extractedTitle, setExtractedTitle] = useState<string>('Kein Song ausgewählt');
  
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
  
  // Metadaten / Bitrate bei Songwechsel berechnen
  useEffect(() => {
    if (!audioSrc) {
      setBitrate(null);
      setSampleRate(null);
      return;
    }
    
    if (audioContextRef.current) {
      const sr = (audioContextRef.current.sampleRate / 1000).toFixed(1);
      setSampleRate(sr);
    }
    
    let isCancelled = false;
    fetch(audioSrc, { method: 'HEAD' })
      .then((res) => {
        const contentLength = res.headers.get('content-length');
        if (contentLength && duration > 0 && !isCancelled) {
          const bytes = parseInt(contentLength, 10);
          const calculatedBps = Math.round((bytes * 8) / duration / 1000);
          setBitrate(calculatedBps > 0 ? calculatedBps.toString() : '320');
        } else {
          setBitrate('320');
        }
      })
      .catch(() => {
        if (!isCancelled) setBitrate('320');
      });
    
    return () => {
      isCancelled = true;
    };
  }, [audioSrc, duration]);
  
  // Titel-Parsing
  useEffect(() => {
    let title = 'Kein Song ausgewählt';
    
    if (audioSrc) {
      try {
        const url = new URL(audioSrc, window.location.origin);
        const folderParam = url.searchParams.get('folder');
        const songParam = url.searchParams.get('song');
        
        const extractedFolder = folderParam ? decodeURIComponent(folderParam) : '';
        const extractedSong = songParam ? decodeURIComponent(songParam).replace(/^\d+\s*[-–—]\s*/, '').replace(/\.[^/.]+$/, '') : '';
        
        if (extractedFolder && extractedSong) {
          title = `${extractedFolder} - ${extractedSong}`;
        } else if (extractedSong) {
          title = extractedSong;
        }
      } catch (e) {
        console.warn('Fehler beim Parsen der audioSrc URL:', e);
      }
    }
    
    if ((!audioSrc || title === 'Kein Song ausgewählt') && currentSong) {
      title = currentSong.replace(/^\d+\s*[-–—]\s*/, '').replace(/\.[^/.]+$/, '');
    }
    
    setExtractedTitle(title);
  }, [audioSrc, currentSong]);
  
  // Source-Wechsel und Auto-Play
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
  
  return {
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
  };
}