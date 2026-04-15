// src/components/Menu/usePresetJsonImport.ts

import { useCallback } from "react";
import { useSnackbar } from "notistack";

import { useAppDispatch } from "../../redux/hooks";
import { importDataAction } from "../../redux/store/reducers/preset-reducer";
import { normalizePreset } from "../../redux/store/reducers/normalizePreset";

export function usePresetJsonImport({
  markClean,
  setRecentSelection,
  setMode,
}: {
  markClean: (preset: any) => void;
  setRecentSelection: (id: string) => void;
  setMode: (mode: "local" | "cloud") => void;
}) {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const importJson = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        const normalised = await normalizePreset(data);

        dispatch(importDataAction(normalised));
        markClean(normalised);
        setMode("local");
        setRecentSelection("");

        enqueueSnackbar("Preset imported", { variant: "success" });
      } catch (err: any) {
        enqueueSnackbar(
          err?.message ? `Import failed: ${err.message}` : "Import failed",
          { variant: "error" },
        );
      }
    },
    [dispatch, enqueueSnackbar, markClean, setRecentSelection, setMode],
  );

  return { importJson };
}
