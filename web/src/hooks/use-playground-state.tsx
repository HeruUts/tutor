// use-playground-state.ts
"use client";

import React, {
  createContext,
  useReducer,
  useContext,
  ReactNode,
  Dispatch,
  useEffect,
  useState,
} from "react";
import {
  PlaygroundState,
  defaultSessionConfig,
  defaultPlaygroundState,
} from "@/data/playground-state";
import { playgroundStateHelpers } from "@/lib/playground-state-helpers";
import { getDefaultPresets, Preset } from "@/data/presets";
// Add this type definition near the top of your file, after the imports
type Action =
  | {
      type: "SET_SESSION_CONFIG";
      payload: Partial<PlaygroundState["sessionConfig"]>;
    }
  | { type: "SET_API_KEY"; payload: string | null }
  | { type: "SET_INSTRUCTIONS"; payload: string }
  | { type: "SET_USER_PRESETS"; payload: Preset[] }
  | { type: "SET_SELECTED_PRESET_ID"; payload: string | null }
  | { type: "SAVE_USER_PRESET"; payload: Preset }
  | { type: "DELETE_USER_PRESET"; payload: string };
const LS_OPENAI_API_KEY_NAME = "OPENAI_API_KEY";
const LS_USER_PRESETS_KEY = "PG_USER_PRESETS";
const LS_SELECTED_PRESET_ID_KEY = "PG_SELECTED_PRESET_ID";

const presetStorageHelper = {
  getStoredPresets: (): Preset[] => {
    const storedPresets = localStorage.getItem(LS_USER_PRESETS_KEY);
    return storedPresets ? JSON.parse(storedPresets) : [];
  },
  setStoredPresets: (presets: Preset[]): void => {
    localStorage.setItem(LS_USER_PRESETS_KEY, JSON.stringify(presets));
  },
  getStoredSelectedPresetId: async (): Promise<string> => {
    const defaultPresets = await getDefaultPresets();
    return (
      localStorage.getItem(LS_SELECTED_PRESET_ID_KEY) || defaultPresets[0].id
    );
  },
  setStoredSelectedPresetId: (presetId: string | null): void => {
    if (presetId !== null) {
      localStorage.setItem(LS_SELECTED_PRESET_ID_KEY, presetId);
    } else {
      localStorage.removeItem(LS_SELECTED_PRESET_ID_KEY);
    }
  },
};

// ... (keep existing Action types and reducer function)

interface PlaygroundStateContextProps {
  pgState: PlaygroundState;
  dispatch: Dispatch<Action>;
  helpers: typeof playgroundStateHelpers;
  showAuthDialog: boolean;
  setShowAuthDialog: React.Dispatch<React.SetStateAction<boolean>>;
  isPresetsLoading: boolean;
}
// Create the provider component
interface PlaygroundStateProviderProps {
  children: ReactNode;
}
const PlaygroundStateContext = createContext<
  PlaygroundStateContextProps | undefined
>(undefined);

export const usePlaygroundState = (): PlaygroundStateContextProps => {
  const context = useContext(PlaygroundStateContext);
  if (!context) {
    throw new Error(
      "usePlaygroundState must be used within a PlaygroundStateProvider",
    );
  }
  return context;
};
// Update the reducer to handle async operations differently
function playgroundStateReducer(
  state: PlaygroundState,
  action: Action,
): PlaygroundState {
  switch (action.type) {
    case "SET_SESSION_CONFIG":
      return {
        ...state,
        sessionConfig: {
          ...state.sessionConfig,
          ...action.payload,
        },
      };
    case "SET_API_KEY":
      if (action.payload) {
        localStorage.setItem(LS_OPENAI_API_KEY_NAME, action.payload);
      } else {
        localStorage.removeItem(LS_OPENAI_API_KEY_NAME);
      }
      return {
        ...state,
        openaiAPIKey: action.payload,
      };
    case "SET_INSTRUCTIONS":
      return {
        ...state,
        instructions: action.payload,
      };
    case "SET_USER_PRESETS":
      return {
        ...state,
        userPresets: action.payload,
      };
    case "SET_SELECTED_PRESET_ID":
      presetStorageHelper.setStoredSelectedPresetId(action.payload);
      
      // Return the state immediately without waiting for the preset
      // The actual preset loading will be handled in the effect
      return {
        ...state,
        selectedPresetId: action.payload,
        // Reset these temporarily - they'll be updated in the effect
        instructions: "",
        sessionConfig: defaultSessionConfig
      };
    case "SAVE_USER_PRESET":
      const updatedPresetsAdd = state.userPresets.map((preset) =>
        preset.id === action.payload.id ? action.payload : preset,
      );
      if (!updatedPresetsAdd.some((preset) => preset.id === action.payload.id)) {
        updatedPresetsAdd.push(action.payload);
      }
      presetStorageHelper.setStoredPresets(updatedPresetsAdd);
      return {
        ...state,
        userPresets: updatedPresetsAdd,
      };
    case "DELETE_USER_PRESET":
      const updatedPresetsDelete = state.userPresets.filter(
        (preset: Preset) => preset.id !== action.payload,
      );
      presetStorageHelper.setStoredPresets(updatedPresetsDelete);
      return {
        ...state,
        userPresets: updatedPresetsDelete,
      };
    default:
      return state;
  }
}
export const PlaygroundStateProvider = ({
  children,
}: PlaygroundStateProviderProps) => {
  const [state, dispatch] = useReducer(
    playgroundStateReducer,
    defaultPlaygroundState,
  );
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isPresetsLoading, setIsPresetsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Load API key
        const storedKey = localStorage.getItem(LS_OPENAI_API_KEY_NAME);
        if (storedKey && storedKey.length >= 1) {
          dispatch({ type: "SET_API_KEY", payload: storedKey });
        } else {
          dispatch({ type: "SET_API_KEY", payload: null });
          setShowAuthDialog(true);
        }

        // Load presets from localStorage
        const storedPresets = localStorage.getItem(LS_USER_PRESETS_KEY);
        const userPresets = storedPresets ? JSON.parse(storedPresets) : [];
        dispatch({ type: "SET_USER_PRESETS", payload: userPresets });

        // Read the URL only if we're in browser environment
        if (typeof window !== "undefined") {
          const urlData = await playgroundStateHelpers.decodeFromURLParams(
            window.location.search,
          );

          if (urlData?.state?.selectedPresetId) {
            const selectedPreset = await playgroundStateHelpers.getSelectedPreset({
              ...state,
              selectedPresetId: urlData.state.selectedPresetId,
              userPresets,
            });

            if (selectedPreset) {
              dispatch({ 
                type: "SET_SELECTED_PRESET_ID", 
                payload: selectedPreset.id 
              });
              
              // Update instructions and sessionConfig from the resolved preset
              dispatch({ 
                type: "SET_INSTRUCTIONS", 
                payload: selectedPreset.instructions || "" 
              });
              
              dispatch({
                type: "SET_SESSION_CONFIG",
                payload: selectedPreset.sessionConfig || defaultSessionConfig,
              });
            }

            // Handle non-default preset from URL
            if (urlData.preset?.name && !selectedPreset?.defaultGroup) {
              const newPreset: Preset = {
                id: urlData.state.selectedPresetId,
                name: urlData.preset.name || "Shared Preset",
                description: urlData.preset.description,
                instructions: urlData.state.instructions || "",
                sessionConfig: urlData.state.sessionConfig || defaultSessionConfig,
                defaultGroup: undefined,
              };

              const updatedUserPresets = [...userPresets, newPreset];
              presetStorageHelper.setStoredPresets(updatedUserPresets);
              dispatch({ type: "SET_USER_PRESETS", payload: updatedUserPresets });
              dispatch({ 
                type: "SET_SELECTED_PRESET_ID", 
                payload: newPreset.id 
              });
            }

            // Clear the URL for non-default presets
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        }
      } catch (error) {
        console.error("Error initializing playground state:", error);
      } finally {
        setIsPresetsLoading(false);
      }
    };

    initialize();
  }, []);

  return (
    <PlaygroundStateContext.Provider
      value={{
        pgState: state,
        dispatch,
        helpers: playgroundStateHelpers,
        showAuthDialog,
        setShowAuthDialog,
        isPresetsLoading,
      }}
    >
      {children}
    </PlaygroundStateContext.Provider>
  );
};