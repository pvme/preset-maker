// src/components/Menu/Menu.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RecentPresetDropdown } from './RecentPresetDropdown';
import { addRecentPreset, removeRecentPreset } from '../../storage/recent-presets';
import { loadPresetById } from '../../storage/preset-storage';

import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageIcon from '@mui/icons-material/Image';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CloudIcon from '@mui/icons-material/Cloud';

import { validate } from 'typescript-json';
import { type SavedPreset as SavedPresetData } from '../../schemas/saved-preset-data';
import { PresetSummary } from '../../schemas/preset-summary';
import { blankPreset } from '../../schemas/preset';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { usePresetExport } from '../../hooks/usePresetExport';
import { selectPreset, importDataAction } from '../../redux/store/reducers/preset-reducer';
import { exportAsJson } from '../../utility/export-to-json';
import { sanitizeAndStringifyPreset } from '../../utility/sanitizer';
import { SavePresetDialog, SavePresetDialogState } from '../SavePresetDialog/SavePresetDialog';
import { presetsAreEqual } from '../../utility/comparePresets';

import './Menu.css';

import { useGlobalLoading } from '../../storage/GlobalLoadingContext';
import { useStorageMode } from '../../storage/StorageModeContext';
import { LocalPresetStorage } from '../../storage/LocalPresetStorage';
import { CloudPresetStorage } from '../../storage/CloudPresetStorage';

import { getAuth, onAuthStateChanged } from "../../utility/firebase-init";
import { FunctionURLs } from '../../api/function-urls';

declare global {
  interface Window {
    _presetLoadStale?: boolean;
  }
}

//
// Status Indicator
//
const StatusChip = ({ isDirty }: { isDirty: boolean | null }) => {
  if (isDirty === null) return null;
  return (
    <Chip
      icon={isDirty ? <WarningIcon /> : <CheckIcon />}
      label={isDirty ? 'Unsaved Changes' : 'Saved'}
      color={isDirty ? 'warning' : 'success'}
      variant="outlined"
      size="small"
      className="preset-menu__chip"
    />
  );
};

//
// MAIN COMPONENT
//
export const PresetMenu = (): JSX.Element => {
  const { mode, setMode } = useStorageMode();
  const { beginGlobalSave, endGlobalSave } = useGlobalLoading();

  const getStorage = () =>
    mode === 'cloud' ? CloudPresetStorage : LocalPresetStorage;

  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const preset = useAppSelector(selectPreset);
  const { presetName, presetNotes, inventorySlots, equipmentSlots, relics, familiars } = preset;

  const [recentList, setRecentList] = useState<PresetSummary[]>([]);
  const [recentSelection, setRecentSelection] = useState('');

  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [selectModeOpen, setSelectModeOpen] = useState(false);

  const [isDirty, setIsDirty] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef<any>(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const {
    copyImage,
    downloadImage,
    clipboardSupported
  } = usePresetExport(presetName);

  //
  // LOGIN STATE
  //
  useEffect(() =>
    onAuthStateChanged(getAuth(), (user) => setIsLoggedIn(!!user)),
    []
  );

  //
  // RECENT LIST LOAD
  //
  useEffect(() => {
    setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));
  }, []);

  //
  // Load preset if URL contains an ID
  //
  useEffect(() => {
    if (!id) return;

    let stale = false;
    const load = async () => {
      try {
        const { data, source } = await loadPresetById(id);
        if (stale || window._presetLoadStale) return;

        dispatch(importDataAction(data));
        lastSavedRef.current = JSON.parse(JSON.stringify(data));

        setRecentSelection(data.presetId!);
        setMode(source);
        setIsDirty(false);

        addRecentPreset({ presetId: data.presetId!, presetName: data.presetName, source });
      } catch {
        if (!stale) enqueueSnackbar(`Preset not found for ID ${id}`, { variant: 'error' });
      }
    };

    load();
    return () => { stale = true; };
  }, [id, dispatch, enqueueSnackbar, setMode]);

  //
  // Recent dropdown handler
  //
  const loadRecent = useCallback(async (p: PresetSummary) => {
    try {
      const storage = p.source === "local" ? LocalPresetStorage : CloudPresetStorage;
      const data = await storage.getPreset(p.presetId);

      dispatch(importDataAction(data));
      lastSavedRef.current = JSON.parse(JSON.stringify(data));

      setRecentSelection(p.presetId);
      setMode(p.source);
      setIsDirty(false);

      window.location.hash = `#/${p.presetId}`;
    } catch {
      enqueueSnackbar(`Failed to load ${p.presetName}`, { variant: 'error' });
    }
  }, [dispatch, enqueueSnackbar, setMode]);

  //
  // Dirty flag tracking
  //
  useEffect(() => {
    if (lastSavedRef.current) {
      setIsDirty(!presetsAreEqual(preset, lastSavedRef.current));
    }
  }, [preset]);

  useEffect(() => {
    if (lastSavedRef.current === null) {
      lastSavedRef.current = JSON.parse(JSON.stringify(preset));
    }
  }, []);

  //
  // File upload handler
  //
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
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

      dispatch(importDataAction(data));
      enqueueSnackbar("Preset imported", { variant: "success" });
    };

    reader.readAsText(event.target.files[0]);
    event.target.value = '';
  }, [dispatch, enqueueSnackbar]);

  const importData = useCallback(() => fileInputRef.current?.click(), []);

  //
  // Export JSON
  //
  const exportData = useCallback(() => {
    const str = sanitizeAndStringifyPreset({
      presetName,
      presetNotes,
      inventorySlots,
      equipmentSlots,
      relics,
      familiars,
      breakdown: preset.breakdown,
    });
    exportAsJson(`PRESET_${presetName.replaceAll(" ", "_")}`, str);
  }, [presetName, presetNotes, inventorySlots, equipmentSlots, relics, familiars, preset.breakdown]);

  //
  // Save preset
  //
  const handleSave = useCallback(async () => {
    if (!id) return setSaveAsOpen(true);

    setIsSaving(true);
    if (mode === "cloud") beginGlobalSave("Saving…");

    try {
      await getStorage().savePreset(preset, id);

      addRecentPreset({ presetId: id, presetName, source: mode });
      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      lastSavedRef.current = JSON.parse(JSON.stringify(preset));
      setIsDirty(false);
      enqueueSnackbar("Preset saved!", { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" });
    } finally {
      setIsSaving(false);
      if (mode === "cloud") endGlobalSave();
    }
  }, [id, preset, presetName, mode, enqueueSnackbar]);

  //
  // Save As
  //
  const handleSaveAsSubmit = useCallback(async (newName: string) => {
    setIsSaving(true);
    beginGlobalSave("Saving…");
    try {
      const payload = { ...preset, presetName: newName };
      const newId = await getStorage().savePreset(payload);

      addRecentPreset({ presetId: newId, presetName: newName, source: mode });
      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      setTimeout(() => {
        window._presetLoadStale = true;
        window.location.hash = `#/${newId}`;
      }, 0);

      enqueueSnackbar("Preset saved!", { variant: "success" });
    } catch (err: any) {
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: "error" });
    } finally {
      setSaveAsOpen(false);
      setIsSaving(false);
      endGlobalSave();
    }
  }, [preset, mode, enqueueSnackbar]);

  //
  // Copy embed link
  //
  const handleCopyEmbedLink = () => {
    if (!id) return;
    const url = `${FunctionURLs.presetEmbed}?id=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
    enqueueSnackbar("Embed link copied", { variant: "success" });
  };

  //
  // Reset to blank preset
  //
  const resetToBlankPreset = () => {
    dispatch(importDataAction({
      ...blankPreset,
      breakdown: []
    }));

    lastSavedRef.current = JSON.parse(JSON.stringify(blankPreset));
    setRecentSelection("");
    setIsDirty(true);
    navigate("/");
    enqueueSnackbar("New preset created", { variant: "info" });
  };

  //
  // New Preset button
  //
  const handleNew = () => {
    if (isDirty) setConfirmDiscardOpen(true);
    else setSelectModeOpen(true);
  };

  const confirmNewPreset = () => {
    setConfirmDiscardOpen(false);
    setSelectModeOpen(true);
  };

  //
  // RENDER
  //
  return (
    <Paper className="preset-menu__paper">
      <Grid container alignItems="center" justifyContent="space-between" sx={{ mt: 2, p: 2 }}>
        <Grid item md="auto">
          <Stack direction="row" spacing={3} alignItems="center">
            <Button onClick={handleNew} startIcon={<AddIcon />} variant="contained">
              New Preset
            </Button>

            <RecentPresetDropdown
              selected={recentSelection}
              onSelect={loadRecent}
              items={recentList}
            />
          </Stack>
        </Grid>

        <Grid item md="auto">
          <Stack direction="row" spacing={3} alignItems="center">

            {/* EXPORT MENU */}
            <Button onClick={e => setAnchorExport(e.currentTarget)} endIcon={<ArrowDropDown />}>
              Export
            </Button>
            <Menu anchorEl={anchorExport} open={!!anchorExport} onClose={() => setAnchorExport(null)}>

              {mode === "local" && id && (
                <>
                  <MenuItem
                    onClick={async () => {
                      beginGlobalSave("Saving…");

                      try {
                        const newId = await CloudPresetStorage.savePreset(preset);

                        addRecentPreset({ presetId: newId, presetName, source: "cloud" });
                        localStorage.removeItem(`preset:${id}`);
                        removeRecentPreset(id);

                        setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));
                        setMode("cloud");

                        enqueueSnackbar("Uploaded to cloud", { variant: "success" });

                        setTimeout(() => {
                          window._presetLoadStale = true;
                          window.location.hash = `#/${newId}`;
                          endGlobalSave();
                        }, 400);

                      } catch (err: any) {
                        enqueueSnackbar(`Upload failed: ${err.message}`, { variant: "error" });
                        endGlobalSave();
                      }
                    }}
                  >
                    <ListItemIcon><CloudIcon fontSize="small" /></ListItemIcon>
                    <ListItemText primary="Upload to Cloud" />
                  </MenuItem>
                  <Divider />
                </>
              )}

              <MenuItem onClick={handleCopyEmbedLink} disabled={!id}>
                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Copy Embed Link" />
              </MenuItem>

              <Divider />

              <MenuItem
                disabled={!clipboardSupported}
                onClick={async () => {
                  try {
                    await copyImage();
                    enqueueSnackbar("Copied image!", { variant: "success" });
                  } catch {
                    enqueueSnackbar("Failed to copy image", { variant: "error" });
                  }
                }}>
                <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Copy Image" />
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  try {
                    await downloadImage();
                    enqueueSnackbar("Downloaded!", { variant: "success" });
                  } catch {
                    enqueueSnackbar("Failed to download image", { variant: "error" });
                  }
                }}>
                <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Download Image" />
              </MenuItem>

              <Divider />

              <MenuItem onClick={exportData}>
                <ListItemIcon><FileDownloadIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Export JSON" />
              </MenuItem>

              <MenuItem onClick={importData}>
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

            {/* SAVE BUTTON */}
            <Button
              disabled={!isDirty || isSaving}
              onClick={
                mode === "local"
                  ? (id ? handleSave : () => setSaveAsOpen(true))
                  : (isLoggedIn ? handleSave : () => setSaveAsOpen(true))
              }
              startIcon={isSaving ? undefined : <SaveIcon />}
              variant="contained"
              color="success"
            >
              {isSaving ? (
                <CircularProgress size={20} color="inherit" />
              ) : mode === "local" ? (
                "Save"
              ) : (
                isLoggedIn ? "Save" : "Save As"
              )}
            </Button>

            <StatusChip isDirty={isDirty} />
          </Stack>
        </Grid>
      </Grid>

      {/* SAVE AS DIALOG */}
      <SavePresetDialog
        open={saveAsOpen}
        state={SavePresetDialogState.NewPreset}
        onSave={handleSaveAsSubmit}
        onClose={() => setSaveAsOpen(false)}
        defaultName={presetName}
      />

      {/* UNSAVED CHANGES DIALOG */}
      <Dialog open={confirmDiscardOpen} onClose={() => setConfirmDiscardOpen(false)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Unsaved Changes</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>Discard changes and create a new preset?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscardOpen(false)}>Cancel</Button>
          <Button onClick={confirmNewPreset} variant="contained" color="warning" startIcon={<AddIcon />}>
            Discard & Create New
          </Button>
        </DialogActions>
      </Dialog>

      {/* SELECT STORAGE MODE */}
      <Dialog open={selectModeOpen} onClose={() => setSelectModeOpen(false)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AddIcon />
            <Typography variant="h6">New Preset</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>Where should the new preset be stored?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectModeOpen(false)}>Cancel</Button>

          <Button
            onClick={() => {
              setMode("local");
              resetToBlankPreset();
              setSelectModeOpen(false);
            }}
            variant="contained"
          >
            Local
          </Button>

          <Button
            onClick={() => {
              setMode("cloud");
              resetToBlankPreset();
              setSelectModeOpen(false);
            }}
            variant="contained"
            startIcon={<CloudIcon />}
          >
            Cloud
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
};

export default PresetMenu;
