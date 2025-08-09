"use client";

import * as React from "react";
import { CaretSortIcon, FileIcon } from "@radix-ui/react-icons";
import { Check, Trash, RefreshCw } from "lucide-react"; // Added RefreshCw icon
import { PopoverProps } from "@radix-ui/react-popover";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { Preset, PresetGroup } from "../data/presets";
import { usePlaygroundState } from "@/hooks/use-playground-state";
import { useConnection } from "@/hooks/use-connection";

export function PresetSelector(props: PopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [presetToDelete, setPresetToDelete] = React.useState<Preset | null>(null);
  const [defaultPresets, setDefaultPresets] = React.useState<Preset[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [needsRefresh, setNeedsRefresh] = React.useState(false); // New state for refresh indicator
  const { pgState, dispatch, helpers } = usePlaygroundState();
  const { disconnect, connect, shouldConnect } = useConnection();

  const [lastPresetId, setLastPresetId] = React.useState<string | null>(null);

  // Load default presets on mount
  React.useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await helpers.getDefaultPresets();
        setDefaultPresets(presets);
      } catch (error) {
        console.error("Failed to load presets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPresets();
  }, [helpers]);

  React.useEffect(() => {
    if (pgState.selectedPresetId !== lastPresetId) {
      setLastPresetId(pgState.selectedPresetId);
      if (shouldConnect) {
        disconnect().then(() => {
          connect();
        });
      }
    }
  }, [pgState.selectedPresetId, shouldConnect, disconnect, connect, lastPresetId]);

  const handleDelete = () => {
    if (presetToDelete) {
      dispatch({
        type: "DELETE_USER_PRESET",
        payload: presetToDelete.id,
      });
      setShowDeleteDialog(false);
      setPresetToDelete(null);
      toast({
        title: "Preset removed",
        description: "Your saved preset has been removed.",
      });
    }
  };

  const handlePresetSelect = async (presetId: string | null) => {
    dispatch({
      type: "SET_SELECTED_PRESET_ID",
      payload: presetId,
    });
    setOpen(false);
    setNeedsRefresh(true); // Mark that refresh is needed after selection

    // Clear URL for non-default presets
    const selectedPreset = await helpers.getSelectedPreset({
      ...pgState,
      selectedPresetId: presetId,
    });
    if (selectedPreset && !selectedPreset.defaultGroup) {
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (selectedPreset && selectedPreset.defaultGroup) {
      // Update URL for default presets
      const params = await helpers.encodeToUrlParams({
        ...pgState,
        selectedPresetId: presetId,
      });
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${params ? `?${params}` : ""}`,
      );
    }
  };

  const handleRefresh = () => {
    // Re-dispatch the selected preset to force an update
    dispatch({
      type: "SET_SELECTED_PRESET_ID",
      payload: pgState.selectedPresetId,
    });
    setNeedsRefresh(false);
  };

  const selectedPreset = [...defaultPresets, ...pgState.userPresets].find(
    preset => preset.id === pgState.selectedPresetId
  );

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        disabled
      >
        Loading presets...
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2"> {/* Wrapper div for flex layout */}
      <Popover open={open} onOpenChange={setOpen} {...props}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-label="Load…"
            aria-expanded={open}
            className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
          >
            <div className="flex items-center">
              {selectedPreset?.icon && (
                <selectedPreset.icon className="mr-2 h-4 w-4" />
              )}
              <span>{selectedPreset?.name || "Load…"}</span>
            </div>
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search…" />
            <CommandList className="max-h-[320px]">
              {pgState.userPresets.length > 0 && (
                <CommandGroup heading="Saved">
                  {pgState.userPresets.map((preset: Preset) => (
                    <CommandItem
                      key={preset.id}
                      value={preset.id}
                      onSelect={() => handlePresetSelect(preset.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="flex items-center">
                              {preset.icon && (
                                <preset.icon className="mr-2 h-4 w-4" />
                              )}
                              <span>{preset.name}</span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            className="w-80"
                            side="bottom"
                            align="start"
                            alignOffset={20}
                          >
                            <p>{preset.description}</p>
                          </HoverCardContent>
                        </HoverCard>
                        <div className="flex items-center space-x-2">
                          <Check
                            className={cn(
                              "h-4 w-4",
                              pgState.selectedPresetId === preset.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPresetToDelete(preset);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash className="h-4 w-4 text-red-500 hover:text-red-700" />
                          </Button>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              <CommandSeparator />

              <CommandGroup>
                <CommandItem
                  value="blank"
                  onSelect={() => handlePresetSelect(null)}
                >
                  <div className="flex items-center">
                    <FileIcon className="mr-2 h-4 w-4" />
                    <span>Start from scratch</span>
                  </div>
                </CommandItem>
              </CommandGroup>

              {Object.values(PresetGroup).map((group) => {
                const groupPresets = defaultPresets.filter(
                  (preset) => preset.defaultGroup === group
                );
                
                if (groupPresets.length === 0) return null;

                return (
                  <CommandGroup key={group} heading={group}>
                    {groupPresets.map((preset: Preset) => (
                      <CommandItem
                        key={preset.id}
                        value={preset.id}
                        onSelect={() => handlePresetSelect(preset.id)}
                      >
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="flex items-center">
                              {preset.icon && (
                                <preset.icon className="mr-2 h-4 w-4" />
                              )}
                              <span>{preset.name}</span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            className="w-80"
                            side="bottom"
                            align="start"
                            alignOffset={20}
                          >
                            <p>{preset.description}</p>
                          </HoverCardContent>
                        </HoverCard>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4 mr-2",
                            pgState.selectedPresetId === preset.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Refresh button that appears when changes need to be applied */}
      {needsRefresh && (
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleRefresh}
          title="Apply preset changes"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{presetToDelete?.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}