// hooks/usePresets.ts
import { defaultPresets } from '../data/presets';
import { useUserContext } from './user-context';

export const usePresets = () => {
  const { username } = useUserContext();

  const formatInstructions = (instructions: string): string => {
    return username 
      ? instructions.replace(/\{user\.username\}/g, username)
      : instructions.replace(/\{user\.username\}/g, 'friend');
  };

  const getPreset = (presetId: string) => {
    const preset = defaultPresets.find(p => p.id === presetId);
    if (!preset) return null;
    
    return {
      ...preset,
      instructions: formatInstructions(preset.instructions)
    };
  };

  const getAllPresets = () => {
    return defaultPresets.map(preset => ({
      ...preset,
      instructions: formatInstructions(preset.instructions)
    }));
  };

  return { getPreset, getAllPresets };
};