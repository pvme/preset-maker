// src/components/Menu/usePresetSave.ts

import { useCallback, useState } from "react";
import { useSnackbar } from "notistack";

import { addRecentPreset } from "../../storage/recent-presets";
import { LocalPresetStorage } from "../../storage/LocalPresetStorage";
import { CloudPresetStorage } from "../../storage/CloudPresetStorage";
import { useGlobalLoading } from "../../storage/GlobalLoadingContext";

import {
  type SavedPreset,
  EMPTY_SAVED_PRESET,
} from "../../schemas/saved-preset-data";

function trimFilled(list: { id: string }[] | undefined, max?: number) {
  const safe = Array.isArray(list) ? list : [];
  const trimmed = safe.filter((item) => item?.id);
  return typeof max === "number" ? trimmed.slice(0, max) : trimmed;
}

function toSavedPreset(preset: any): SavedPreset {
  return {
    presetName: preset?.presetName ?? "",
    presetNotes: preset?.presetNotes ?? "",
    inventorySlots: (preset?.inventorySlots ?? []).slice(0, 28),
    equipmentSlots: (preset?.equipmentSlots ?? []).slice(0, 12),
    familiar: preset?.familiar?.id ? { id: preset.familiar.id } : { id: "" },
    relics: trimFilled(preset?.relics, 3),
    aspect: preset?.aspect?.id ? { id: preset.aspect.id } : { id: "" },
    AmmoSpells: trimFilled(preset?.AmmoSpells, 3),
    breakdown: Array.isArray(preset?.breakdown) ? preset.breakdown : [],
  };
}

export function usePresetSave({
  preset,
  presetName,
  mode,
  id,
  markClean,
  setRecentList,
}: {
  preset: any;
  presetName: string;
  mode: "local" | "cloud";
  id?: string;
  markClean: () => void;
  setRecentList: (list: any[]) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const { beginGlobalSave, endGlobalSave } = useGlobalLoading();
  const [isSaving, setIsSaving] = useState(false);

  const save = useCallback(async () => {
    if (!id) return;

    setIsSaving(true);
    if (mode === "cloud") beginGlobalSave("Saving…");

    try {
      const storage =
        mode === "cloud" ? CloudPresetStorage : LocalPresetStorage;

      await storage.savePreset(toSavedPreset(preset), id);

      addRecentPreset({ presetId: id, presetName, source: mode });
      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      markClean();
      enqueueSnackbar("Preset saved!", { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" });
    } finally {
      setIsSaving(false);
      if (mode === "cloud") endGlobalSave();
    }
  }, [
    id,
    preset,
    presetName,
    mode,
    enqueueSnackbar,
    beginGlobalSave,
    endGlobalSave,
    markClean,
    setRecentList,
  ]);

  const saveAs = useCallback(
    async (newName: string) => {
      setIsSaving(true);
      beginGlobalSave("Saving…");

      try {
        const payload: SavedPreset = {
          ...toSavedPreset(preset),
          presetName: newName,
        };

        const newId = await LocalPresetStorage.savePreset(payload);

        addRecentPreset({
          presetId: newId,
          presetName: newName,
          source: "local",
        });

        setRecentList(
          JSON.parse(localStorage.getItem("recentPresets") || "[]"),
        );

        markClean();
        enqueueSnackbar("Preset created locally!", { variant: "success" });
        return newId;
      } catch (err: any) {
        enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" });
      } finally {
        setIsSaving(false);
        endGlobalSave();
      }
    },
    [
      preset,
      enqueueSnackbar,
      beginGlobalSave,
      endGlobalSave,
      markClean,
      setRecentList,
    ],
  );

  const saveFresh = useCallback(
    async (newName: string) => {
      setIsSaving(true);
      beginGlobalSave("Saving…");

      try {
        const payload: SavedPreset = {
          ...EMPTY_SAVED_PRESET,
          presetName: newName,
        };

        const newId = await LocalPresetStorage.savePreset(payload);

        addRecentPreset({
          presetId: newId,
          presetName: newName,
          source: "local",
        });

        setRecentList(
          JSON.parse(localStorage.getItem("recentPresets") || "[]"),
        );

        markClean();
        enqueueSnackbar("Preset created locally!", { variant: "success" });
        return newId;
      } catch (err: any) {
        enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" });
      } finally {
        setIsSaving(false);
        endGlobalSave();
      }
    },
    [enqueueSnackbar, beginGlobalSave, endGlobalSave, markClean, setRecentList],
  );

  return {
    save,
    saveAs,
    saveFresh,
    isSaving,
  };
}
