// src/components/PresetLoader/PresetLoader.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  CloudDownload as CloudDownloadIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { selectPreset, importDataAction } from '../../redux/store/reducers/preset-reducer';
import { SavePresetDialog, SavePresetDialogState } from '../SavePresetDialog/SavePresetDialog';
import { getPreset } from '../../api/get-preset';
import { PresetSummary } from '../../schemas/preset-summary';
import { presetsAreEqual } from '../../utility/comparePresets';
import './PresetLoader.css';

const LOCAL_STORAGE_KEY = 'recentPresets';
const MAX_RECENT_PRESETS = 20;

interface StatusChipProps {
  isDirty: boolean | null;
}

const StatusChip: React.FC<StatusChipProps> = ({ isDirty }) => {
  const theme = useTheme();
  
  if (isDirty === null) return null;
  
  return (
    <Chip
      icon={isDirty ? <WarningIcon /> : <CheckIcon />}
      label={isDirty ? 'Unsaved Changes' : 'Saved'}
      color={isDirty ? 'warning' : 'success'}
      variant="outlined"
      size="small"
      className="preset-loader__status-chip"
      sx={{
        height: 32,
        fontWeight: 500,
        borderWidth: 2,
        '& .MuiChip-icon': {
          fontSize: '1rem',
        },
        ...(isDirty && {
          backgroundColor: alpha(theme.palette.warning.main, 0.1),
          animation: 'preset-loader-pulse 2s infinite',
        }),
      }}
    />
  );
};

export const PresetLoader: React.FC = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();
  const theme = useTheme();

  const preset = useAppSelector(selectPreset) as any;
  const [cloudPresets, setCloudPresets] = useState<PresetSummary[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [isDirty, setIsDirty] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const lastSavedRef = useRef<any>(null);

  const saveToRecentPresets = useCallback((summary: PresetSummary) => {
    try {
      const prev = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as PresetSummary[];
      const updated = [
        summary,
        ...prev.filter(p => p.presetId !== summary.presetId)
      ].slice(0, MAX_RECENT_PRESETS);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setCloudPresets(updated);
      setSelected(summary.presetName);
    } catch (error) {
      console.error('Failed to save to recent presets:', error);
      enqueueSnackbar('Failed to save preset to recent list', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleRemovePreset = useCallback((presetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const presetToRemove = cloudPresets.find(p => p.presetId === presetId);
    if (!presetToRemove) return;

    const updated = cloudPresets.filter(p => p.presetId !== presetId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    setCloudPresets(updated);
    
    if (selected === presetToRemove.presetName) {
      setSelected('');
    }
    
    enqueueSnackbar(`Removed "${presetToRemove.presetName}" from recent presets`, { 
      variant: 'info' 
    });
  }, [cloudPresets, selected, enqueueSnackbar]);

  // Load recent presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as PresetSummary[];
      setCloudPresets(stored);
    } catch (error) {
      console.error('Failed to load recent presets:', error);
      setCloudPresets([]);
    }
  }, []);

  // Load preset from URL parameter
  useEffect(() => {
    if (!id) return;
    
    setIsLoading(true);
    getPreset(id)
      .then(presetData => {
        if (!presetData.presetId || !presetData.presetName) {
          throw new Error('Preset is missing required fields');
        }
        
        dispatch(importDataAction(presetData));
        lastSavedRef.current = JSON.parse(JSON.stringify(presetData));
        saveToRecentPresets({ 
          presetId: presetData.presetId, 
          presetName: presetData.presetName 
        });
        setIsDirty(false);
        enqueueSnackbar(`Loaded preset: ${presetData.presetName}`, { variant: 'success' });
      })
      .catch(error => {
        console.error('Failed to load preset:', error);
        enqueueSnackbar('Failed to load preset from URL', { variant: 'error' });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, dispatch, enqueueSnackbar, saveToRecentPresets]);

  // Track changes to current preset
  useEffect(() => {
    if (lastSavedRef.current) {
      const dirty = !presetsAreEqual(preset, lastSavedRef.current);
      setIsDirty(dirty);
    }
  }, [preset]);

  // Auto-save to recent presets when changes are saved
  useEffect(() => {
    if (!isDirty && preset.presetId && preset.presetName) {
      saveToRecentPresets({ 
        presetId: preset.presetId, 
        presetName: preset.presetName 
      });
    }
  }, [isDirty, preset.presetId, preset.presetName, saveToRecentPresets]);

  const handleSelectCloud = async (e: SelectChangeEvent<string>) => {
    const name = e.target.value;
    const found = cloudPresets.find(p => p.presetName === name);
    
    if (!found) {
      enqueueSnackbar('Preset not found in recent list', { variant: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const data = await getPreset(found.presetId);
      
      if (!data.presetId || !data.presetName) {
        throw new Error('Preset is missing required fields');
      }

      lastSavedRef.current = JSON.parse(JSON.stringify(data));
      dispatch(importDataAction(data));
      navigate(`/${data.presetId}`, { replace: true });
      saveToRecentPresets({ 
        presetId: data.presetId, 
        presetName: data.presetName 
      });
      setIsDirty(false);
      enqueueSnackbar(`Loaded preset: ${data.presetName}`, { variant: 'success' });
    } catch (error) {
      console.error('Failed to load preset:', error);
      enqueueSnackbar('Failed to load selected preset', { variant: 'error' });
    } finally {
      setIsLoading(false);
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
    enqueueSnackbar('Created new preset', { variant: 'info' });
  };

  const handleSavePreset = () => {
    setDialogOpen(true);
  };

  return (
    <>
      <Box className="preset-loader" component="header">
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center"
          className="preset-loader__toolbar"
        >
          <FormControl size="small" className="preset-loader__select-control">
            <InputLabel id="recent-presets-label">Recent Presets</InputLabel>
            <Select
              labelId="recent-presets-label"
              label="Recent Presets"
              value={selected || ''}
              onChange={handleSelectCloud}
              disabled={isLoading}
              displayEmpty
              renderValue={(value) => (
                <Box display="flex" alignItems="center" gap={1}>
                  <CloudDownloadIcon fontSize="small" color="action" />
                  <Typography variant="body2" noWrap>
                    {value || 'Select a preset...'}
                  </Typography>
                </Box>
              )}
              MenuProps={{
                PaperProps: {
                  className: 'preset-loader__menu',
                  sx: {
                    maxHeight: 400,
                    '& .MuiMenuItem-root': {
                      minHeight: 48,
                    },
                  },
                },
              }}
            >
              {cloudPresets.length === 0 ? (
                <MenuItem disabled>
                  <Typography variant="body2" color="text.secondary">
                    No recent presets
                  </Typography>
                </MenuItem>
              ) : (
                cloudPresets.map(preset => (
                  <MenuItem 
                    key={preset.presetId} 
                    value={preset.presetName}
                    className="preset-loader__menu-item"
                  >
                    <ListItemIcon>
                      <CloudDownloadIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={preset.presetName}
                      primaryTypographyProps={{
                        noWrap: true,
                        variant: 'body2',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => handleRemovePreset(preset.presetId, e)}
                      className="preset-loader__remove-button"
                      aria-label={`Remove ${preset.presetName} from recent presets`}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <StatusChip isDirty={isDirty} />

          <Stack direction="row" spacing={1}>
            {isDirty && (
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSavePreset}
                size="small"
                className="preset-loader__save-button"
              >
                Save
              </Button>
            )}
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNew}
              size="small"
              className="preset-loader__new-button"
              disabled={isLoading}
            >
              New
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Confirm Discard Dialog */}
      <Dialog 
        open={confirmDiscardOpen} 
        onClose={() => setConfirmDiscardOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WarningIcon color="warning" />
            <Typography variant="h6">Unsaved Changes</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography>
            You have unsaved changes that will be lost. Do you want to discard them and create a new preset?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDiscardOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmNewPreset}
            variant="contained"
            color="warning"
            startIcon={<AddIcon />}
          >
            Discard & Create New
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Preset Dialog */}
      <SavePresetDialog
        open={dialogOpen}
        state={SavePresetDialogState.NewPreset}
        onSave={() => setDialogOpen(false)}
        onClose={() => setDialogOpen(false)}
      />
    </>
  );
};

export const PresetName = PresetLoader;
export default PresetLoader;