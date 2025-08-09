// hooks/usePresets.ts
import { Preset,getDefaultPresets } from '../data/presets';
import { useUserContext } from './user-context';
import { useEffect, useState } from 'react';

export const usePresets = () => {
  const { username } = useUserContext();
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    const loadPresets = async () => {
      const loadedPresets = await getDefaultPresets();
      setPresets(loadedPresets);
    };
    loadPresets();
  }, []);

  const formatInstructions = (instructions: string): string => {
    return username
      ? instructions.replace(/\{user\.username\}/g, username)
      : instructions.replace(/\{user\.username\}/g, 'friend');
  };

  const getPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return null;
    
    return {
      ...preset,
      instructions: formatInstructions(preset.instructions)
    };
  };

  const getAllPresets = () => {
    return presets.map(preset => ({
      ...preset,
      instructions: formatInstructions(preset.instructions)
    }));
  };

  return { getPreset, getAllPresets };
};