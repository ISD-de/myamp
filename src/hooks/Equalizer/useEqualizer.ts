import { useEffect, useRef, useState } from 'react';

export interface BandSetting {
  label: string;
  frequency: number;
  gain: number;
}

const ITUNES_BANDS: BandSetting[] = [
  { label: '70', frequency: 70, gain: 3 },
  { label: '180', frequency: 180, gain: -4 },
  { label: '320', frequency: 320, gain: -6 },
  { label: '600', frequency: 600, gain: -9 },
  { label: '1K', frequency: 1000, gain: -9 },
  { label: '3K', frequency: 3000, gain: -8 },
  { label: '6K', frequency: 6000, gain: -5 },
  { label: '12K', frequency: 12000, gain: -3 },
  { label: '14K', frequency: 14000, gain: 2 },
  { label: '16K', frequency: 16000, gain: 7 }
];

export interface UseEqualizerOptions {
  audioContext: AudioContext | null;
  sourceNode: MediaElementAudioSourceNode | null;
  destinationNode?: AudioNode;
}

export function useEqualizer({
                               audioContext,
                               sourceNode,
                               destinationNode,
                             }: UseEqualizerOptions) {
  const [isFlat, setIsFlat] = useState<boolean>(false);
  const [preampGain, setPreampGain] = useState<number>(0);
  const [pan, setPan] = useState<number>(0);
  const [bands, setBands] = useState<BandSetting[]>(ITUNES_BANDS);
  
  const preampNodeRef = useRef<GainNode | null>(null);
  const pannerNodeRef = useRef<StereoPannerNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  
  useEffect(() => {
    if (!audioContext || !sourceNode) return;
    
    const targetDestination = destinationNode || audioContext.destination;
    
    // Erstelle Nodes
    const preamp = audioContext.createGain();
    preamp.gain.value = Math.pow(10, preampGain / 20);
    preampNodeRef.current = preamp;
    
    let panner: StereoPannerNode | null = null;
    if (audioContext.createStereoPanner) {
      panner = audioContext.createStereoPanner();
      panner.pan.value = pan;
      pannerNodeRef.current = panner;
    }
    
    const filters = ITUNES_BANDS.map((band, index) => {
      const filter = audioContext.createBiquadFilter();
      if (index === 0) filter.type = 'lowshelf';
      else if (index === ITUNES_BANDS.length - 1) filter.type = 'highshelf';
      else {
        filter.type = 'peaking';
        filter.Q.value = 1.4;
      }
      filter.frequency.value = band.frequency;
      filter.gain.value = isFlat ? 0 : band.gain;
      return filter;
    });
    filterNodesRef.current = filters;
    
    // Signal-Kette aufbauen
    try {
      sourceNode.disconnect();
    } catch (e) {
      // Ignorieren falls nicht verbunden
    }
    
    let lastNode: AudioNode = sourceNode;
    lastNode.connect(preamp);
    lastNode = preamp;
    
    filters.forEach((filter) => {
      lastNode.connect(filter);
      lastNode = filter;
    });
    
    if (panner) {
      lastNode.connect(panner);
      lastNode = panner;
    }
    
    lastNode.connect(targetDestination);
    
    return () => {
      try {
        sourceNode.disconnect();
        filters.forEach((f) => f.disconnect());
        preamp.disconnect();
        panner?.disconnect();
        sourceNode.connect(targetDestination);
      } catch (e) {
        console.warn('Equalizer cleanup warning:', e);
      }
    };
  }, [audioContext, sourceNode, destinationNode]);
  
  const handlePreampChange = (val: number) => {
    setPreampGain(val);
    if (preampNodeRef.current) {
      preampNodeRef.current.gain.value = Math.pow(10, val / 20);
    }
  };
  
  const handlePanChange = (val: number) => {
    setPan(val);
    if (pannerNodeRef.current) {
      pannerNodeRef.current.pan.value = val;
    }
  };
  
  const handleBandChange = (index: number, newGain: number) => {
    const updated = [...bands];
    updated[index].gain = newGain;
    setBands(updated);
    
    if (!isFlat && filterNodesRef.current[index]) {
      filterNodesRef.current[index].gain.value = newGain;
    }
  };
  
  const toggleFlatMode = (flatState: boolean) => {
    setIsFlat(flatState);
    filterNodesRef.current.forEach((filter, i) => {
      filter.gain.value = flatState ? 0 : bands[i].gain;
    });
  };
  
  return {
    isFlat,
    preampGain,
    pan,
    bands,
    handlePreampChange,
    handlePanChange,
    handleBandChange,
    toggleFlatMode,
  };
}