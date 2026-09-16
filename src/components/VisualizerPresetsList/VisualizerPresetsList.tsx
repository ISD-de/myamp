'use client';

import React, {useEffect, useState} from 'react';
import butterchurnPresets from 'butterchurn-presets';

interface PresetSelectorProps {
  onPresetChange: (presetData: any, presetName: string) => void;
  className?: string;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
                                                                onPresetChange,
                                                                className = ''
                                                              }) => {
  const [presets, setPresets] = useState<Record<string, any>>({});
  const [presetKeys, setPresetKeys] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  
  useEffect(() => {
    // Presets beim Mounten einmalig laden
    const loadedPresets = butterchurnPresets.getPresets();
    const keys = Object.keys(loadedPresets);
    
    setPresets(loadedPresets);
    setPresetKeys(keys);
    
    if (keys.length > 0) {
      const initialKey = keys[0];
      setSelectedPreset(initialKey);
      // Das initiale Preset direkt an die Elternkomponente melden
      onPresetChange(loadedPresets[initialKey], initialKey);
    }
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedPreset(key);
    
    const presetData = presets[key];
    if (presetData) {
      onPresetChange(presetData, key);
    }
  };
  
  return (
    <select
      value={selectedPreset}
      onChange={handleChange}
      className={`bg-slate-800 text-white text-xs border border-slate-700 rounded px-2 py-1 max-w-62.5 truncate focus:outline-none cursor-pointer ${className}`}
    >
      {presetKeys.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
};

export default PresetSelector;