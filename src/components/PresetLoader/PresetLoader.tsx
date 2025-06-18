// src/components/PresetLoader/PresetLoader.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  TextField, MenuItem, Box, Button, Dialog, DialogTitle, DialogActions, Chip, IconButton, InputLabel, FormControl, Select, SelectChangeEvent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { selectPreset, importDataAction } from '../../redux/store/reducers/preset-reducer';

import { SavePresetDialog, SavePresetDialogState } from '../SavePresetDialog/SavePresetDialog';
import { getPreset } from '../../api/get-preset';
import { PresetSummary } from '../../schemas/preset-summary';
import { presetsAreEqual } from '../../utility/comparePresets';
import './PresetLoader.css';

const LOCAL_STORAGE_KEY = 'recentPresets';

export const PresetLoader = (): JSX.Element => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();

  const preset = useAppSelector(selectPreset) as any;
  const [cloudPresets, setCloudPresets] = useState<PresetSummary[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [isDirty, setIsDirty] = useState<boolean | null>(null);
  const lastSavedRef = useRef<any>(null);

  const saveToRecentPresets = (summary: PresetSummary) => {
    const prev = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as PresetSummary[];
    const updated = [summary, ...prev.filter(p => p.presetId !== summary.presetId)].slice(0, 20);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setCloudPresets(updated);
    setSelected(summary.presetName);
  };

  const handleRemovePreset = (presetId: string) => {
    const updated = cloudPresets.filter(p => p.presetId !== presetId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setCloudPresets(updated);
    if (selected && cloudPresets.find(p => p.presetId === presetId)?.presetName === selected) {
      setSelected('');
    }
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as PresetSummary[];
    setCloudPresets(stored);
  }, []);

  useEffect(() => {
    if (!id) return;
    getPreset(id)
      .then(presetData => {
        if (!presetData.presetId || !presetData.presetName) {
          console.warn('[PresetLoader] Missing presetId or presetName in loaded preset:', presetData);
          return;
        }
        dispatch(importDataAction(presetData));
        lastSavedRef.current = JSON.parse(JSON.stringify(presetData));
        saveToRecentPresets({ presetId: presetData.presetId, presetName: presetData.presetName });
        setIsDirty(false);
      })
      .catch(err => {
        console.warn('[PresetLoader] Failed to load preset from URL:', err);
        enqueueSnackbar('Failed to load preset from URL.', { variant: 'error' });
      });
  }, [id, dispatch, enqueueSnackbar]);

  useEffect(() => {
    if (lastSavedRef.current) {
      const dirty = !presetsAreEqual(preset, lastSavedRef.current);
      console.log('[PresetLoader] Checking dirty state:', { dirty, current: preset, saved: lastSavedRef.current });
      setIsDirty(dirty);
    }
  }, [preset]);

  useEffect(() => {
    if (!isDirty && preset.presetId && preset.presetName) {
      console.log('[PresetLoader] Saving to recent presets because not dirty.');
      saveToRecentPresets({ presetId: preset.presetId, presetName: preset.presetName });
    }
  }, [isDirty, preset.presetId, preset.presetName]);

  const handleSelectCloud = async (e: SelectChangeEvent<string>) => {
    const name = e.target.value;
    const found = cloudPresets.find(p => p.presetName === name);
    if (!found) {
      enqueueSnackbar('Preset not found in recent list', { variant: 'error' });
      return;
    }
    try {
      const data = await getPreset(found.presetId);
      if (!data.presetId || !data.presetName) {
        console.warn('[PresetLoader] Missing presetId or presetName in selected preset:', data);
        enqueueSnackbar('Preset is missing required fields.', { variant: 'error' });
        return;
      }
      lastSavedRef.current = JSON.parse(JSON.stringify(data));
      dispatch(importDataAction(data));
      navigate(`/${data.presetId}`, { replace: true });
      saveToRecentPresets({ presetId: data.presetId, presetName: data.presetName });
      setIsDirty(false);
    } catch (err) {
      console.warn('[PresetLoader] Failed to load selected preset:', err);
      enqueueSnackbar('Failed to load selected preset.', { variant: 'error' });
    }
  };

  const handleCreateNew = () => {
    if (isDirty) {
      setConfirmDiscardOpen(true);
    } else {
      navigate('/');
    }
  };

  const confirmNewPreset = () => {
    setConfirmDiscardOpen(false);
    navigate('/');
  };

  return (
    <Box className="preset-menubar" display="flex" alignItems="center" gap={2} p={1}>
      <FormControl size="small" sx={{ minWidth: 240 }}>
        <InputLabel>Recent Presets</InputLabel>
        <Select
          label="Recent Presets"
          value={selected || ''}
          onChange={handleSelectCloud}
          renderValue={(value) => <span>{value}</span>}
        >
          {cloudPresets.map(p => (
            <MenuItem key={p.presetId} value={p.presetName}>
              <Box display="flex" justifyContent="space-between" alignItems="left" width="100%">
                <span>{p.presetName}</span>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePreset(p.presetId);
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button variant="contained" onClick={handleCreateNew}>
        New Preset
      </Button>

      {isDirty === true && (
        <Chip label="Unsaved Changes" color="warning" size="small" sx={{ ml: 1 }} />
      )}
      {isDirty === false && (
        <Chip label="No Changes" color="success" size="small" sx={{ ml: 1 }} />
      )}

      <Dialog open={confirmDiscardOpen} onClose={() => setConfirmDiscardOpen(false)}>
        <DialogTitle>Discard current changes and create a new preset?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDiscardOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirmNewPreset}>Discard & New</Button>
        </DialogActions>
      </Dialog>

      <SavePresetDialog
        open={dialogOpen}
        state={SavePresetDialogState.NewPreset}
        onSave={() => setDialogOpen(false)}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  );
};

export const PresetName = PresetLoader;
export default PresetName;
