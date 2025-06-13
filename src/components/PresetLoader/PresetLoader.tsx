// src/components/PresetLoader/PresetLoader.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams }            from 'react-router-dom';
import { useSnackbar }                       from 'notistack';

import Autocomplete, {
  type AutocompleteChangeDetails,
  type AutocompleteChangeReason,
  type AutocompleteRenderInputParams
} from '@mui/material/Autocomplete';
import Button      from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import IconButton  from '@mui/material/IconButton';
import TextField   from '@mui/material/TextField';
import CloseIcon   from '@mui/icons-material/Close';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  importDataAction,
  selectPreset
} from '../../redux/store/reducers/preset-reducer';
import { type SavedPresetData }          from '../../types/saved-preset-data';

import './PresetLoader.css';
import {
  SavePresetDialog,
  SavePresetDialogState
} from '../SavePresetDialog/SavePresetDialog';
import { LocalStorage } from '../../store/local-storage';

export const PresetName = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { presetId } = useParams<{ presetId?: string }>();

  const [presets, setPresets]             = useState<SavedPresetData[]>([]);
  const [presetNames, setPresetNames]     = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);

  // load from localStorage
  useEffect(() => {
    const data = LocalStorage.loadPresets();
    setPresets(data);
    setPresetNames(data.map(p => p.presetName));
    // if URL has an id, select it
    if (presetId) {
      const found = data.find(p => p.presetId === presetId);
      if (found) {
        setSelectedPreset(found.presetName);
      }
    }
  }, [presetId]);

  const onPresetChange = useCallback(
    (
      _e: React.SyntheticEvent,
      value: string | null,
      _r: AutocompleteChangeReason,
      _d?: AutocompleteChangeDetails<string>
    ) => {
      if (!value) return;
      const found = presets.find(p => p.presetName === value);
      if (!found) {
        enqueueSnackbar('Unable to find preset', { variant: 'error' });
        return;
      }
      // load into Redux
      dispatch(importDataAction(found));
      // update URL
      navigate(`/${found.presetId}`, { replace: true });
      enqueueSnackbar('Loaded preset', { variant: 'success' });
    },
    [presets, dispatch, enqueueSnackbar, navigate]
  );

  const createNewPreset = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const removePreset = useCallback(
    (e: React.MouseEvent, name: string) => {
      e.preventDefault();
      e.stopPropagation();
      let data = LocalStorage.loadPresets();
      data = data.filter(p => p.presetName !== name);
      LocalStorage.saveAllPresets(data);
      setPresets(data);
      setPresetNames(data.map(p => p.presetName));
      enqueueSnackbar('Deleted preset', { variant: 'success' });
    },
    [enqueueSnackbar]
  );

  const handleDialogClose = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  const handleSaveNew = useCallback(
    (newName: string) => {
      // SavePresetDialog will have put a new entry into localStorage
      const data = LocalStorage.loadPresets();
      setPresets(data);
      setPresetNames(data.map(p => p.presetName));

      // find the one we just created
      const justMade = data.find(p => p.presetName === newName);
      if (justMade) {
        dispatch(importDataAction(justMade));
        navigate(`/${justMade.presetId}`, { replace: true });
        enqueueSnackbar('Created and loaded new preset', { variant: 'success' });
      }
      setSaveDialogOpen(false);
    },
    [dispatch, enqueueSnackbar, navigate]
  );

  return (
    <div className="input-group desktop-only">
      <ButtonGroup>
        <Autocomplete
          className="autocomplete-field mr-8"
          disablePortal
          autoHighlight
          disableClearable
          freeSolo
          forcePopupIcon
          value={selectedPreset}
          onChange={onPresetChange}
          options={presetNames}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              label="Load existing preset"
              inputProps={{
                ...params.inputProps,
                autoComplete: 'off'
              }}
            />
          )}
          renderOption={(props, option) => (
            <li {...props} className="option-list">
              {option}
              <IconButton
                size="small"
                onClick={e => removePreset(e, option)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </li>
          )}
        />
        <Button variant="contained" onClick={createNewPreset}>
          Create New Preset
        </Button>
      </ButtonGroup>

      <SavePresetDialog
        open={saveDialogOpen}
        state={SavePresetDialogState.NewPreset}
        onSave={handleSaveNew}
        onClose={handleDialogClose}
      />
    </div>
  );
};

// also default‐export so import paths are flexible
export default PresetName;
