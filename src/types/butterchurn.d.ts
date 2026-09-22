declare module 'butterchurn' {
  export interface ButterchurnOptions {
    width: number;
    height: number;
    pixelRatio?: number;
    textureRatio?: number;
    subSampleSize?: number;
  }
  
  export interface Visualizer {
    connectAudio: (audioNode: AudioNode) => void;
    disconnectAudio: (audioNode: AudioNode) => void;
    loadPreset: (preset: any, blendTime?: number) => void;
    render: () => void;
    setDimensions: (width: number, height: number) => void;
  }
  
  const butterchurn: {
    createVisualizer: (
      audioContext: AudioContext,
      canvas: HTMLCanvasElement,
      options: ButterchurnOptions
    ) => Visualizer;
  };
  
  export default butterchurn;
}

declare module 'butterchurn-presets' {
  const butterchurnPresets: {
    getPresets: () => Record<string, any>;
  };
  
  export default butterchurnPresets;
}