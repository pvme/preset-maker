// src/components/usePresetLoader.ts

import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import { normalizePreset } from "../../redux/store/reducers/normalizePreset";
import { importDataAction } from "../../redux/store/reducers/preset-reducer";
import { useAppDispatch } from "../../redux/hooks";

import { loadPresetById } from "../../storage/preset-storage";
import { LocalPresetStorage } from "../../storage/LocalPresetStorage";
import { CloudPresetStorage } from "../../storage/CloudPresetStorage";
import { addRecentPreset } from "../../storage/recent-presets";
import { useStorageMode } from "../../storage/StorageModeContext";

import { usePresetLoad } from "../../storage/PresetLoadContext";

import { PresetSummary } from "../../schemas/preset-summary";

const presetLoadPromises = new Map<
  string,
  ReturnType<typeof loadPresetById>
>();

function getPresetLoad(id: string) {
  const existing = presetLoadPromises.get(id);
  if (existing) return existing;

  const promise = loadPresetById(id).finally(() => {
    presetLoadPromises.delete(id);
  });

  presetLoadPromises.set(id, promise);
  return promise;
}

export function usePresetLoader({
  id,
  markClean,
  setRecentSelection,
  refreshRecentPresets,
}: {
  id?: string;
  markClean: (preset: any) => void;
  setRecentSelection: (id: string) => void;
  refreshRecentPresets: () => void;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { setMode } = useStorageMode();
  const { skipNextLoad, setSkipNextLoad, setIsPresetLoading } =
    usePresetLoad();

  const lastLoadedIdRef = useRef<string | null>(null);
  const loadTokenRef = useRef(0);

  /* ---------------------------------------------
     Load by URL
  --------------------------------------------- */

  useEffect(() => {
    if (!id) return;
    if (lastLoadedIdRef.current === id) return;
    if (skipNextLoad) {
      setSkipNextLoad(false);
      setIsPresetLoading(false);
      return;
    }

    let cancelled = false;
    const loadToken = ++loadTokenRef.current;
    setIsPresetLoading(true);

    const load = async () => {
      try {
        const { data, presetId, source } = await getPresetLoad(id);
        if (cancelled) return;

        lastLoadedIdRef.current = id;

        dispatch(importDataAction(data));
        markClean(data);

        setRecentSelection(presetId);
        setMode(source);

        addRecentPreset({
          presetId,
          presetName: data.presetName,
          source,
        });
        refreshRecentPresets();
      } catch {
        enqueueSnackbar(`Preset not found for ID ${id}`, {
          variant: "error",
        });
        lastLoadedIdRef.current = null;
      } finally {
        if (loadTokenRef.current === loadToken) {
          setIsPresetLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [
    id,
    skipNextLoad,
    setSkipNextLoad,
    setIsPresetLoading,
    dispatch,
    enqueueSnackbar,
    setMode,
    markClean,
    setRecentSelection,
    refreshRecentPresets,
  ]);

  /* ---------------------------------------------
     Load from recent dropdown
  --------------------------------------------- */

  const loadRecent = useCallback(
    async (preset: PresetSummary) => {
      try {
        const storage =
          preset.source === "local"
            ? LocalPresetStorage
            : CloudPresetStorage;

        const raw = await storage.getPreset(preset.presetId);
        const normalised = await normalizePreset(raw);

        dispatch(importDataAction(normalised));
        markClean(normalised);

        setRecentSelection(preset.presetId);
        setMode(preset.source);

        setSkipNextLoad(true);
        navigate(`/${preset.presetId}`);
      } catch {
        enqueueSnackbar(`Failed to load ${preset.presetName}`, {
          variant: "error",
        });
      }
    },
    [
      dispatch,
      enqueueSnackbar,
      navigate,
      setMode,
      markClean,
      setRecentSelection,
      setSkipNextLoad,
    ]
  );

  return {
    loadRecent,
  };
}
