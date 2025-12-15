// src/components/Menu/Menu.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RecentPresetDropdown } from "./RecentPresetDropdown";
import { addRecentPreset, removeRecentPreset } from "../../storage/recent-presets";
import { loadPresetById } from "../../storage/preset-storage";
import { normalizePreset } from "../../redux/store/reducers/normalizePreset";

import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import LinkIcon from "@mui/icons-material/Link";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ImageIcon from "@mui/icons-material/Image";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import WarningIcon from "@mui/icons-material/Warning";
import CheckIcon from "@mui/icons-material/Check";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloudIcon from "@mui/icons-material/Cloud";

import { validate } from "typescript-json";
import { type SavedPreset as SavedPresetData } from "../../schemas/saved-preset-data";
import { PresetSummary } from "../../schemas/preset-summary";
import { blankPreset } from "../../schemas/preset";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { usePresetExport } from "../../hooks/usePresetExport";
import { selectPreset, importDataAction } from "../../redux/store/reducers/preset-reducer";
import { exportAsJson } from "../../utility/export-to-json";
import { sanitizeAndStringifyPreset } from "../../utility/sanitizer";
import {
  SavePresetDialog,
  SavePresetDialogState,
} from "../SavePresetDialog/SavePresetDialog";
import { presetsAreEqual } from "../../utility/comparePresets";

import { useGlobalLoading } from "../../storage/GlobalLoadingContext";
import { useStorageMode } from "../../storage/StorageModeContext";
import { LocalPresetStorage } from "../../storage/LocalPresetStorage";
import { CloudPresetStorage } from "../../storage/CloudPresetStorage";

import { getAuth, onAuthStateChanged } from "../../utility/firebase-init";
import { FunctionURLs } from "../../api/function-urls";

import "./Menu.css";

/* ---------------------------------------------
   Helpers
--------------------------------------------- */

function stripUIState(preset: any) {
  if (!preset) return preset;
  const {
    slotType,
    slotIndex,
    selectedSlots,
    slotKey,
    ...clean
  } = preset;
  return clean;
}

/* ---------------------------------------------
   Status Chip
--------------------------------------------- */

const StatusChip = ({ isDirty }: { isDirty: boolean | null }) => {
  if (isDirty === null) return null;
  return (
    <Chip
      icon={isDirty ? <WarningIcon /> : <CheckIcon />}
      label={isDirty ? "Unsaved Changes" : "Saved"}
      color={isDirty ? "warning" : "success"}
      variant="outlined"
      size="small"
      className="preset-menu__chip"
    />
  );
};

/* ---------------------------------------------
   Component
--------------------------------------------- */

export const PresetMenu = (): JSX.Element => {
  const { mode, setMode } = useStorageMode();
  const { beginGlobalSave, endGlobalSave } = useGlobalLoading();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id?: string }>();

  const preset = useAppSelector(selectPreset);
  const {
    presetName,
    presetNotes,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars,
    breakdown,
  } = preset;

  const [recentList, setRecentList] = useState<PresetSummary[]>([]);
  const [recentSelection, setRecentSelection] = useState("");

  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [selectModeOpen, setSelectModeOpen] = useState(false);

  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);

  const [isDirty, setIsDirty] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const lastSavedRef = useRef<any>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const canSaveCloud = mode !== "cloud" || isLoggedIn;

  const { copyImage, downloadImage, clipboardSupported } =
    usePresetExport(presetName);

  /* ---------------------------------------------
     Auth
  --------------------------------------------- */

  useEffect(
    () => onAuthStateChanged(getAuth(), (user) => setIsLoggedIn(!!user)),
    []
  );

  /* ---------------------------------------------
     Recent presets
  --------------------------------------------- */
  
  const refreshRecentList = useCallback(() => {
    setRecentList(
      JSON.parse(localStorage.getItem("recentPresets") || "[]")
    );
  }, []);

  useEffect(() => {
    refreshRecentList();
  }, [refreshRecentList]);

  /* ---------------------------------------------
     Load preset by URL
  --------------------------------------------- */

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      try {
        const { data, presetId, source } = await loadPresetById(id);
        if (cancelled) return;

        dispatch(importDataAction(data));
        lastSavedRef.current = stripUIState(
          JSON.parse(JSON.stringify(data))
        );

        setRecentSelection(presetId);
        setMode(source);
        setIsDirty(false);

        addRecentPreset({
          presetId,
          presetName: data.presetName,
          source,
        });
      } catch {
        enqueueSnackbar(`Preset not found for ID ${id}`, {
          variant: "error",
        });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, dispatch, enqueueSnackbar, setMode]);

  /* ---------------------------------------------
     Load recent dropdown
  --------------------------------------------- */

  const loadRecent = useCallback(
    async (p: PresetSummary) => {
      try {
        const storage =
          p.source === "local" ? LocalPresetStorage : CloudPresetStorage;

        const raw = await storage.getPreset(p.presetId);
        const normalised = await normalizePreset(raw);

        dispatch(importDataAction(normalised));
        lastSavedRef.current = stripUIState(
          JSON.parse(JSON.stringify(normalised))
        );

        setRecentSelection(p.presetId);
        setMode(p.source);
        setIsDirty(false);

        navigate(`/${p.presetId}`);
      } catch {
        enqueueSnackbar(`Failed to load ${p.presetName}`, {
          variant: "error",
        });
      }
    },
    [dispatch, enqueueSnackbar, navigate, setMode]
  );

  useEffect(() => {
    if (lastSavedRef.current) return;

    lastSavedRef.current = stripUIState(
      JSON.parse(JSON.stringify(preset))
    );

    setIsDirty(false);
  }, []);

  /* ---------------------------------------------
     Dirty tracking
  --------------------------------------------- */

  useEffect(() => {
    if (!lastSavedRef.current) {
      setIsDirty(false);
      return;
    }

    const clean = stripUIState(lastSavedRef.current);
    const current = stripUIState(preset);

    setIsDirty(!presetsAreEqual(current, clean));
  }, [preset]);

  /* ---------------------------------------------
     File import/export
  --------------------------------------------- */

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files?.length) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (!ev.target?.result) {
          enqueueSnackbar("Invalid file.", { variant: "error" });
          return;
        }

        const data = JSON.parse(ev.target.result as string);
        const result = validate<SavedPresetData>(data);

        if (!result.success) {
          enqueueSnackbar("Invalid preset JSON.", { variant: "error" });
          return;
        }

        const normalised = await normalizePreset(data);

        // 1. Load into UI
        dispatch(importDataAction(normalised));

        // 2. Mark as clean baseline
        const cleanSnapshot = stripUIState(
          JSON.parse(JSON.stringify(normalised))
        );
        lastSavedRef.current = cleanSnapshot;

        // 3. Reset state
        setIsDirty(false);
        setRecentSelection("");
        navigate("/");

        enqueueSnackbar("Preset imported", { variant: "success" });
      };

      reader.readAsText(event.target.files[0]);
      event.target.value = "";
    },
    [dispatch, enqueueSnackbar, navigate]
  );

  const exportData = useCallback(() => {
    const str = sanitizeAndStringifyPreset({
      presetName,
      presetNotes,
      inventorySlots,
      equipmentSlots,
      relics,
      familiars,
      breakdown,
    });
    exportAsJson(`PRESET_${presetName.replaceAll(" ", "_")}`, str);
  }, [
    presetName,
    presetNotes,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars,
    breakdown,
  ]);

  /* ---------------------------------------------
     Save / Save As
  --------------------------------------------- */

  const handleSave = useCallback(async () => {
    if (!id) {
      setSaveAsOpen(true);
      return;
    }

    setIsSaving(true);
    if (mode === "cloud") beginGlobalSave("Saving…");

    try {
      const storage =
        mode === "cloud" ? CloudPresetStorage : LocalPresetStorage;

      await storage.savePreset(preset as any, id);

      addRecentPreset({ presetId: id, presetName, source: mode });
      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      lastSavedRef.current = stripUIState(
        JSON.parse(JSON.stringify(preset))
      );
      setIsDirty(false);

      enqueueSnackbar("Preset saved!", { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" });
    } finally {
      setIsSaving(false);
      if (mode === "cloud") endGlobalSave();
    }
  }, [id, preset, presetName, mode, enqueueSnackbar, beginGlobalSave, endGlobalSave]);

  const handleSaveAsSubmit = useCallback(
    async (newName: string) => {
      setIsSaving(true);
      beginGlobalSave("Saving…");

      try {
        const storage =
          mode === "cloud" ? CloudPresetStorage : LocalPresetStorage;

        const payload = { ...preset, presetName: newName } as any;
        const newId = await storage.savePreset(payload);

        addRecentPreset({ presetId: newId, presetName: newName, source: mode });
        setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

        const saved = { ...preset, presetName: newName };
        dispatch(importDataAction(saved));

        lastSavedRef.current = stripUIState(
          JSON.parse(JSON.stringify(saved))
        );
        setIsDirty(false);
        setRecentSelection(newId);

        navigate(`/${newId}`, { replace: true });

        enqueueSnackbar("Preset saved!", { variant: "success" });
      } catch (err: any) {
        enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" });
      } finally {
        setSaveAsOpen(false);
        setIsSaving(false);
        endGlobalSave();
      }
    },
    [preset, mode, enqueueSnackbar, navigate, beginGlobalSave, endGlobalSave, dispatch]
  );

  /* ---------------------------------------------
     New preset
  --------------------------------------------- */

  const resetToBlankPreset = () => {
    navigate("/");

    dispatch(
      importDataAction({
        ...blankPreset,
        breakdown: [],
      })
    );

    setRecentSelection("");

    lastSavedRef.current = stripUIState(
      JSON.parse(JSON.stringify({
        ...blankPreset,
        breakdown: [],
      }))
    );
    setIsDirty(false);

    enqueueSnackbar("New preset created", { variant: "info" });
  };

  const handleNew = () => {
    if (isDirty) setConfirmDiscardOpen(true);
    else setSelectModeOpen(true);
  };

  const confirmNewPreset = () => {
    setConfirmDiscardOpen(false);
    setSelectModeOpen(true);
  };

  /* ---------------------------------------------
     Render
  --------------------------------------------- */

  return (
    <Paper className="preset-menu__paper">
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{ mt: 2, p: 2 }}
      >
        <Grid item>
          <Stack direction="row" spacing={3} alignItems="center">
            <Button onClick={handleNew} startIcon={<AddIcon />} variant="contained">
              New Preset
            </Button>

            <RecentPresetDropdown
              selected={recentSelection}
              onSelect={loadRecent}
              items={recentList}
              onRemoved={refreshRecentList}
            />
          </Stack>
        </Grid>

        <Grid item>
          <Stack direction="row" spacing={3} alignItems="center">
            <Button
              onClick={(e) => setAnchorExport(e.currentTarget)}
              endIcon={<ArrowDropDown />}
            >
              Export
            </Button>

            <Menu
              anchorEl={anchorExport}
              open={Boolean(anchorExport)}
              onClose={() => setAnchorExport(null)}
              disableScrollLock
            >
              {mode === "local" && id && (
                <>
                  <MenuItem
                    onClick={async () => {
                      beginGlobalSave("Saving…");
                      try {
                        const newId = await CloudPresetStorage.savePreset(preset);
                        addRecentPreset({
                          presetId: newId,
                          presetName,
                          source: "cloud",
                        });
                        localStorage.removeItem(`preset:${id}`);
                        removeRecentPreset(id);
                        setMode("cloud");
                        navigate(`/${newId}`);
                      } finally {
                        endGlobalSave();
                      }
                    }}
                  >
                    <ListItemIcon>
                      <CloudIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Upload to Cloud" />
                  </MenuItem>
                  <Divider />
                </>
              )}

              <MenuItem onClick={() => {
                if (!id) return;
                const url = `${FunctionURLs.presetEmbed}?id=${encodeURIComponent(id)}`;
                navigator.clipboard.writeText(url);
                enqueueSnackbar("Link copied", { variant: "success" });
              }}>
                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Copy Embed Link" />
              </MenuItem>

              <Divider />

              <MenuItem
                disabled={!clipboardSupported}
                onClick={async () => {
                  await copyImage();
                  enqueueSnackbar("Image copied", { variant: "success" });
                }}
              >
                <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Copy Image" />
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  await downloadImage();
                  enqueueSnackbar("Image downloaded", { variant: "success" });
                }}
              >
                <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Download Image" />
              </MenuItem>

              <Divider />

              <MenuItem onClick={exportData}>
                <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Export JSON" />
              </MenuItem>

              <MenuItem onClick={() => fileInputRef.current?.click()}>
                <ListItemIcon><FileUploadIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Import JSON" />
                <input
                  type="file"
                  accept="application/json"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </MenuItem>
            </Menu>

            <Button
              onClick={handleSave}
              disabled={!isDirty || isSaving || !canSaveCloud }
              startIcon={isSaving ? undefined : <SaveIcon />}
              variant="contained"
              color="success"
            >
              {isSaving ? <CircularProgress size={20} /> : "Save"}
            </Button>

            <StatusChip isDirty={isDirty} />
          </Stack>
        </Grid>
      </Grid>

      <SavePresetDialog
        open={saveAsOpen}
        state={SavePresetDialogState.NewPreset}
        defaultName={presetName}
        onSave={handleSaveAsSubmit}
        onClose={() => setSaveAsOpen(false)}
      />

      <Dialog open={confirmDiscardOpen} onClose={() => setConfirmDiscardOpen(false)}>
        <DialogTitle>Discard changes?</DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes. Creating a new preset will discard them.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscardOpen(false)}>Cancel</Button>
          <Button color="warning" onClick={confirmNewPreset}>
            Discard & Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={selectModeOpen} onClose={() => setSelectModeOpen(false)}>
        <DialogTitle>Select preset storage</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Button
              startIcon={<CloudIcon />}
              onClick={() => {
                setMode("cloud");
                resetToBlankPreset();
                setSelectModeOpen(false);
              }}
            >
              Cloud preset
            </Button>
            <Button
              startIcon={<FileDownloadIcon />}
              onClick={() => {
                setMode("local");
                resetToBlankPreset();
                setSelectModeOpen(false);
              }}
            >
              Local preset
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default PresetMenu;
