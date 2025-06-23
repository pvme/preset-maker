// src/components/Menu/Menu.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Save as SaveIcon,
  SaveAs as SaveAsIcon,
  Add as AddIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Image as ImageIcon,
  ArrowDropDown,
  Warning as WarningIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
} from '@mui/icons-material';
import CircularProgress from '@mui/material/CircularProgress';

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

const LOCAL_STORAGE_KEY = 'recentPresets';
const MAX_RECENT_PRESETS = 20;

function saveToRecentPresets(summary: PresetSummary) {
  const prev = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as PresetSummary[];
  const updated = [summary, ...prev.filter(p => p.presetId !== summary.presetId)].slice(0, MAX_RECENT_PRESETS);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
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
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { presetName, presetNotes, inventorySlots, equipmentSlots, relics, familiars } =
    useAppSelector(selectPreset);
  const { enqueueSnackbar } = useSnackbar();
  const preset = useAppSelector(selectPreset);

  const [selected, setSelected] = useState('');
  const [cloudPresets, setCloudPresets] = useState<PresetSummary[]>([]);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);
  const [anchorSave, setAnchorSave] = useState<null | HTMLElement>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [isDirty, setIsDirty] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedRef = useRef<any>(null);

  const {
    copyImage,
    downloadImage,
    clipboardSupported
  } = usePresetExport(presetName);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as PresetSummary[];
    setCloudPresets(stored);
  }, []);

  useEffect(() => {
    if (!id) return;

    getPreset(id).then(presetData => {
      dispatch(importDataAction(presetData));
      lastSavedRef.current = JSON.parse(JSON.stringify(presetData));
      setSelected(presetData.presetName);
      setIsDirty(false);

      if (typeof presetData.presetId === 'string' && typeof presetData.presetName === 'string') {
        saveToRecentPresets({
          presetId: presetData.presetId,
          presetName: presetData.presetName
        });
      } else {
        console.warn('Invalid presetData returned from getPreset():', presetData);
      }
    });
  }, [id, dispatch]);

  useEffect(() => {
    if (lastSavedRef.current) {
      setIsDirty(!presetsAreEqual(preset, lastSavedRef.current));
    }
  }, [preset]);

  useEffect(() => {
    if (!id && lastSavedRef.current === null) {
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
    try {
      await uploadPreset(preset, id);
      saveToRecentPresets({ presetId: id, presetName: preset.presetName });
      setSelected(preset.presetName);
      lastSavedRef.current = JSON.parse(JSON.stringify(preset));
      setIsDirty(false);
      enqueueSnackbar('Preset saved!', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsSubmit = async (name: string) => {
    try {
      const payload = { ...preset, presetName: name };
      const { id: newId } = await uploadPreset(payload);
      saveToRecentPresets({ presetId: newId, presetName: name });
      window.location.hash = `#/${newId}`;
      enqueueSnackbar('Preset cloned!', { variant: 'success' });
    } catch (err: any) {
      enqueueSnackbar(`Save As failed: ${err.message}`, { variant: 'error' });
    } finally {
      setSaveAsOpen(false);
    }
  };

  const handleCopyEmbedLink = () => {
    if (!id) return;
    const url = `${FunctionURLs.presetEmbed}?id=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
    enqueueSnackbar('Embed link copied!', { variant: 'success' });
  };

  const handleSelectCloud = async (e: any) => {
    const name = e.target.value;
    const found = cloudPresets.find(p => p.presetName === name);
    if (!found) return;
    const data = await getPreset(found.presetId);
    lastSavedRef.current = JSON.parse(JSON.stringify(data));
    dispatch(importDataAction(data));
    window.location.hash = `#/${data.presetId}`;
    setSelected(data.presetName);
    setIsDirty(false);
  };

  const resetToBlankPreset = () => {
    dispatch(importDataAction({
      ...blankPreset,
      relics: {
        primaryRelics: preset.relics.primaryRelics?.map(() => ({
          name: '',
          label: '',
          image: '',
          energy: 0,
        })) ?? [],

        alternativeRelics: preset.relics.alternativeRelics?.map(() => ({
          name: '',
          label: '',
          image: '',
          energy: 0,
        })) ?? [],
      },
      familiars: {
        primaryFamiliars: preset.familiars.primaryFamiliars?.map(() => ({
          name: '',
          label: '',
          image: '',
        })) ?? [],

        alternativeFamiliars: preset.familiars.alternativeFamiliars?.map(() => ({
          name: '',
          label: '',
          image: '',
        })) ?? [],
      }
    }));

    lastSavedRef.current = JSON.parse(JSON.stringify(blankPreset));
    setSelected('');
    navigate('/');
    enqueueSnackbar('Created new preset', { variant: 'info' });
  };

  const handleNew = () => {
    isDirty ? setConfirmDiscardOpen(true) : resetToBlankPreset();
  };

  const confirmNewPreset = () => {
    setConfirmDiscardOpen(false);
    resetToBlankPreset();
  };

  return (
    <Paper className="preset-menu__paper">
      <Grid container alignItems="center" justifyContent="space-between" sx={{ marginTop: "16px", padding: "16px" }}>
        <Grid item md="auto">
          <Stack direction="row" spacing={3} alignItems="center">
            <Button onClick={handleNew} startIcon={<AddIcon />} variant="contained" size="medium">
              New
            </Button>
            <FormControl size="small" sx={{ minWidth: 350 }}>
              <InputLabel id="recent-label">Recent Presets</InputLabel>
              <Select
                labelId="recent-label"
                value={selected || ''}
                onChange={handleSelectCloud}
                label="Recent Presets"
                renderValue={(value) => <span>{value}</span>}
                MenuProps={{ disableScrollLock: true }}
              >
                {cloudPresets.length === 0 ? (
                  <MenuItem disabled>No recent presets</MenuItem>
                ) : (
                  cloudPresets.map(p => (
                    <MenuItem key={p.presetId} value={p.presetName}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                        <span>{p.presetName}</span>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = cloudPresets.filter(cp => cp.presetId !== p.presetId);
                            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
                            setCloudPresets(updated);
                            if (selected === p.presetName) setSelected('');
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
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
              </MenuItem>            </Menu>
              <Button
                disabled={!isDirty || isSaving}
                onClick={handleSave}
                startIcon={isSaving ? undefined : <SaveIcon />}
                variant="contained"
                color="success"
                size="medium"
              >
                {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
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
    </Paper>
  );
};

export default PresetMenu;
