// src/components/Menu/usePresetSave.ts

import { useCallback, useState } from "react";
import { useSnackbar } from "notistack";
import { addRecentPreset } from "../../storage/recent-presets";
import { LocalPresetStorage } from "../../storage/LocalPresetStorage";
import { CloudPresetStorage } from "../../storage/CloudPresetStorage";
import { useGlobalLoading } from "../../storage/GlobalLoadingContext";

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
  markClean: (snapshot: any) => void;
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

      await storage.savePreset(preset as any, id);

      addRecentPreset({ presetId: id, presetName, source: mode });
      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      markClean(preset);
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
        const storage =
          mode === "cloud" ? CloudPresetStorage : LocalPresetStorage;

        const payload = { ...preset, presetName: newName } as any;
        const newId = await storage.savePreset(payload);

        addRecentPreset({
          presetId: newId,
          presetName: newName,
          source: mode,
        });
        setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

        const saved = { ...preset, presetName: newName };
        markClean(saved);

        enqueueSnackbar("Preset saved!", { variant: "success" });
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
      mode,
      enqueueSnackbar,
      beginGlobalSave,
      endGlobalSave,
      markClean,
      setRecentList,
    ]
  );

  return {
    save,
    saveAs,
    isSaving,
  };
}
