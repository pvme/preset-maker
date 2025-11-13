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
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CloudIcon from '@mui/icons-material/Cloud';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import { alpha } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageIcon from '@mui/icons-material/Image';
import ArrowDropDown from '@mui/icons-material/ArrowDropDown';
import WarningIcon from '@mui/icons-material/Warning';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

import { validate } from 'typescript-json';
import { type SavedPreset as SavedPresetData } from '../../schemas/saved-preset-data';
import { PresetSummary } from '../../schemas/preset-summary';
import { blankPreset } from '../../schemas/preset';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { usePresetExport } from '../../hooks/usePresetExport';
import { uploadPreset } from '../../api/upload-preset';
import { getPreset } from '../../api/get-preset';
import { selectPreset, importDataAction } from '../../redux/store/reducers/preset-reducer';
import { exportAsJson } from '../../utility/export-to-json';
import { sanitizeAndStringifyPreset } from '../../utility/sanitizer';
import { SavePresetDialog, SavePresetDialogState } from '../SavePresetDialog/SavePresetDialog';
import { presetsAreEqual } from '../../utility/comparePresets';
import './Menu.css';
import { FunctionURLs } from '../../api/function-urls';

import { useGlobalLoading } from '../../storage/GlobalLoadingContext';

import { useStorageMode } from '../../storage/StorageModeContext';
import { LocalPresetStorage } from '../../storage/LocalPresetStorage';
import { CloudPresetStorage } from '../../storage/CloudPresetStorage';

declare global {
  interface Window {
    _presetLoadStale?: boolean;
  }
}

const StatusChip = ({ isDirty }: { isDirty: boolean | null }) => {
  const theme = useTheme();
  if (isDirty === null) return null;
  return (
    <Chip
      icon={isDirty ? <WarningIcon /> : <CheckIcon />}
      label={isDirty ? 'Unsaved Changes' : 'Saved'}
      color={isDirty ? 'warning' : 'success'}
      variant="outlined"
      size="small"
      className="preset-menu__chip"
      sx={isDirty ? {
        backgroundColor: alpha(theme.palette.warning.main, 0.1),
        animation: 'preset-loader-pulse 2s infinite',
      } : {}}
    />
  );
};

export const PresetMenu = (): JSX.Element => {
  const { mode, setMode } = useStorageMode();
  const { beginGlobalSave, endGlobalSave } = useGlobalLoading();

  const getStorage = () =>
    mode === 'cloud' ? CloudPresetStorage : LocalPresetStorage;

  const [recentSelection, setRecentSelection] = useState('');
  const [recentList, setRecentList] = useState<PresetSummary[]>([]);

  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { presetName, presetNotes, inventorySlots, equipmentSlots, relics, familiars } =
    useAppSelector(selectPreset);
  const { enqueueSnackbar } = useSnackbar();
  const preset = useAppSelector(selectPreset);

  const [selected, setSelected] = useState('');
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);
  const [anchorSave, setAnchorSave] = useState<null | HTMLElement>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [isDirty, setIsDirty] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectModeOpen, setSelectModeOpen] = useState(false);
  const lastSavedRef = useRef<any>(null);

  const {
    copyImage,
    downloadImage,
    clipboardSupported
  } = usePresetExport(presetName);

  // Handler for initial load (if ID defined)
  useEffect(() => {
    if (!id) return;

    let isStale = false; // mark this effect instance as active
    const requestedId = id;

    const fetchById = async () => {
      try {
        const { data, source } = await loadPresetById(requestedId);

        const currentHashId = window.location.hash.replace('#/', '');

        if (
          isStale ||
          window._presetLoadStale ||      // ← NEW
          currentHashId !== requestedId
        ) return;

        dispatch(importDataAction(data));
        lastSavedRef.current = JSON.parse(JSON.stringify(data));
        setSelected(data.presetId!);
        setRecentSelection(data.presetId!);
        setMode(source);
        setIsDirty(false);
        addRecentPreset({ presetId: data.presetId!, presetName: data.presetName, source });
      } catch {
        const currentHashId = window.location.hash.replace('#/', '');

        if (
          isStale ||
          window._presetLoadStale ||      // ← NEW
          currentHashId !== requestedId
        ) return;

        enqueueSnackbar(`Preset not found for ID ${requestedId}`, { variant: 'error' });
      }
    };

    fetchById();

    return () => {
      isStale = true;
    };
  }, [id, dispatch, enqueueSnackbar, setMode]);

  // Handler for dropdown selection
  const loadRecent = async (p: PresetSummary) => {
    try {
      const loader = p.source === 'local' ? LocalPresetStorage : CloudPresetStorage;
      const data = await loader.getPreset(p.presetId);

      dispatch(importDataAction(data));
      lastSavedRef.current = JSON.parse(JSON.stringify(data));
      setSelected(data.presetId!);
      setRecentSelection(data.presetId!);
      setMode(p.source);
      setIsDirty(false);

      window.location.hash = `#/${data.presetId}`;
    } catch {
      enqueueSnackbar(`Failed to load ${p.presetName}`, { variant: 'error' });
    }
  };

  // Track dirty changes
  useEffect(() => {
    if (lastSavedRef.current) {
      setIsDirty(!presetsAreEqual(preset, lastSavedRef.current));
    }
  }, [preset]);

  // Baseline on first mount
  useEffect(() => {
    if (lastSavedRef.current === null) {
      lastSavedRef.current = JSON.parse(JSON.stringify(preset));
    }
  }, []);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recentPresets") || "[]");
    setRecentList(stored);
  }, []);

  // Baseline after loading a specific preset by id
  useEffect(() => {
    if (id && lastSavedRef.current === null) {
      lastSavedRef.current = JSON.parse(JSON.stringify(preset));
      setIsDirty(false);
    }
  }, [id, preset]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files == null) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result === null || event.target?.result === undefined) {
          enqueueSnackbar(
            'Internal Server Error - Send your .json to nullopt#2057',
            { variant: 'error' }
          );
          return;
        }

        const data = JSON.parse(event.target.result as string);
        const validationResult = validate<SavedPresetData>(data);
        if (!validationResult.success) {
          console.error(validationResult.errors);
          enqueueSnackbar('Invalid JSON data.', { variant: 'error' });
          return;
        }

        dispatch(importDataAction(data));
        enqueueSnackbar('Successfully imported your preset.', {
          variant: 'success'
        });
      };

      reader.readAsText(event.target.files[0]);
      event.target.value = '';
    },
    [dispatch, enqueueSnackbar]
  );

  const importData = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const exportData = useCallback(() => {
    const stringifiedPresetData = sanitizeAndStringifyPreset({
      presetName,
      presetNotes,
      equipmentSlots,
      inventorySlots,
      relics,
      familiars
    });
    exportAsJson(
      `PRESET_${presetName.replaceAll(' ', '_')}`,
      stringifiedPresetData
    );
  }, [presetName, presetNotes, inventorySlots, equipmentSlots, relics, familiars]);

  const handleSave = async () => {
    if (!id) return setSaveAsOpen(true);

    setIsSaving(true);

    if (mode === 'cloud') beginGlobalSave("Saving to cloud…");

    try {
      await getStorage().savePreset(preset, id);

      addRecentPreset({ presetId: id!, presetName: preset.presetName, source: mode });

      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      setRecentSelection(id);
      setSelected(id);
      lastSavedRef.current = JSON.parse(JSON.stringify(preset));
      setIsDirty(false);
      enqueueSnackbar('Preset saved!', { variant: 'success' });

    } catch (err: any) {
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: 'error' });
    } finally {
      setIsSaving(false);
      if (mode === 'cloud') endGlobalSave();
    }
  };

  const handleSaveAsSubmit = async (name: string) => {
    setIsSaving(true);
    
    beginGlobalSave("Saving to cloud…");

    try {
      const payload = { ...preset, presetName: name };
      const newId = await getStorage().savePreset(payload);
      addRecentPreset({ presetId: newId, presetName: name, source: mode });

      setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

      setRecentSelection(newId);
      setSelected(newId);
      setTimeout(() => {
        window._presetLoadStale = true;
        window.location.hash = `#/${newId}`;
      }, 0);

      enqueueSnackbar('Preset cloned!', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(`Save As failed: ${err.message}`, { variant: 'error' });
    } finally {
      setIsSaving(false);
      setSaveAsOpen(false);
      endGlobalSave();
    }
  };

  const handleCopyEmbedLink = () => {
    if (!id) return;
    const url = `${FunctionURLs.presetEmbed}?id=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
    enqueueSnackbar('Embed link copied!', { variant: 'success' });
  };

  const resetToBlankPreset = () => {
    dispatch(importDataAction({
      ...blankPreset,
      relics: {
        primaryRelics: preset.relics.primaryRelics?.map(() => ({
          name: '',
          label: '',
          image: '',
          breakdownNotes: '',
          energy: 0,
          description: '',
        })) ?? [],

        alternativeRelics: preset.relics.alternativeRelics?.map(() => ({
          name: '',
          label: '',
          image: '',
          breakdownNotes: '',
          energy: 0,
          description: '',
        })) ?? [],
      },
      familiars: {
        primaryFamiliars: preset.familiars.primaryFamiliars?.map(() => ({
          name: '',
          label: '',
          image: '',
          breakdownNotes: '',
        })) ?? [],

        alternativeFamiliars: preset.familiars.alternativeFamiliars?.map(() => ({
          name: '',
          label: '',
          image: '',
          breakdownNotes: '',
        })) ?? [],
      }
    }));

    lastSavedRef.current = JSON.parse(JSON.stringify(blankPreset));
    setSelected('');
    setRecentSelection('');
    setIsDirty(true);
    navigate('/');
    enqueueSnackbar('Created new preset', { variant: 'info' });
  };

  const handleNew = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
    } else {
      setSelectModeOpen(true);
    }
  };

  const confirmNewPreset = () => {
    setConfirmDiscardOpen(false);
    setSelectModeOpen(true);
  };

  return (
    <Paper className="preset-menu__paper">
      <Grid container alignItems="center" justifyContent="space-between" sx={{ marginTop: "16px", padding: "16px" }}>
        <Grid item md="auto">
          <Stack direction="row" spacing={3} alignItems="center">
            <Button onClick={handleNew} startIcon={<AddIcon />} variant="contained" size="medium">
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
            <Button
              onClick={e => setAnchorExport(e.currentTarget)}
              endIcon={<ArrowDropDown />}
            >
              Export
            </Button>
            <Menu anchorEl={anchorExport} open={Boolean(anchorExport)} onClose={() => setAnchorExport(null)} disableScrollLock>
              {mode === 'local' && id && (
                <>
                  <MenuItem
                    onClick={async () => {
                      beginGlobalSave("Saving to cloud…");
                      try {
                        const newId = await CloudPresetStorage.savePreset(preset);

                        addRecentPreset({ presetId: newId, presetName: preset.presetName, source: 'cloud' });
                        localStorage.removeItem(`preset:${id}`);
                        removeRecentPreset(id);
                        setRecentList(JSON.parse(localStorage.getItem("recentPresets") || "[]"));

                        setMode('cloud');

                        enqueueSnackbar('Uploaded to cloud and removed local copy', {
                          variant: 'success'
                        });

                        // keep overlay up until navigation finishes
                        setTimeout(() => {
                          window._presetLoadStale = true;
                          window.location.hash = `#/${newId}`;
                          endGlobalSave();
                        }, 400);

                      } catch (err: any) {
                        enqueueSnackbar(`Failed to upload to cloud: ${err.message}`, { variant: 'error' });
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

              <MenuItem onClick={handleCopyEmbedLink} disabled={!id}>
                <ListItemIcon><LinkIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Copy Embed Link" />
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={async () => {
                  try {
                    await copyImage();
                    enqueueSnackbar('Image copied to clipboard!', { variant: 'success' });
                  } catch (err: any) {
                    enqueueSnackbar('Failed to copy image.', { variant: 'error' });
                  }
                }}
                disabled={!clipboardSupported}
              >
                <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Copy Image" />
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  try {
                    await downloadImage();
                    enqueueSnackbar('Image downloaded.', { variant: 'success' });
                  } catch (err: any) {
                    enqueueSnackbar('Failed to download image.', { variant: 'error' });
                  }
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
              <MenuItem onClick={importData}>
                <ListItemIcon><FileUploadIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary="Import JSON" />
                <input
                  type="file"
                  accept="application/json"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </MenuItem>
            </Menu>
            <Button
              disabled={!isDirty || isSaving}
              onClick={
                mode === 'local'
                  ? (id ? handleSave : () => setSaveAsOpen(true))
                  : () => setSaveAsOpen(true)
              }
              startIcon={isSaving ? undefined : <SaveIcon />}
              variant="contained"
              color="success"
              size="medium"
            >
              {isSaving ? <CircularProgress size={20} color="inherit" /> : mode === 'local' ? 'Save' : 'Save As'}
            </Button>
            <StatusChip isDirty={isDirty} />
          </Stack>
        </Grid>
      </Grid>

      <SavePresetDialog
        open={saveAsOpen}
        state={SavePresetDialogState.NewPreset}
        onSave={handleSaveAsSubmit}
        onClose={() => setSaveAsOpen(false)}
        defaultName={preset.presetName}
      />

      <Dialog open={confirmDiscardOpen} onClose={() => setConfirmDiscardOpen(false)}>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Unsaved Changes</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes. Discard and create a new preset?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscardOpen(false)}>Cancel</Button>
          <Button onClick={confirmNewPreset} variant="contained" color="warning" startIcon={<AddIcon />}>
            Discard & Create New
          </Button>
        </DialogActions>
      </Dialog>

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
              setMode('local');
              resetToBlankPreset();
              setSelectModeOpen(false);
            }}
            variant="contained"
          >
            Local
          </Button>
          <Button
            onClick={() => {
              setMode('cloud');
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
