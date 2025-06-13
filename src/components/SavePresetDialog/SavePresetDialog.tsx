import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  selectPreset,
  setPresetName
} from '../../redux/store/reducers/preset-reducer';

import { LocalStorage } from '../../store/local-storage';
import './SavePresetDialog.css';

export enum SavePresetDialogState {
  None,
  NewPreset,
  ExistingPreset,
}

interface SavePresetDialogProps {
  open: boolean;
  state: SavePresetDialogState;
  /** now receives the new name */
  onSave?: (newName: string) => void;
  onClose: () => void;
}

export const SavePresetDialog = ({
  open,
  state,
  onSave,
  onClose
}: SavePresetDialogProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const {
    presetName,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars
  } = useAppSelector(selectPreset);

  const onPresetNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setError(value.length === 0);
      setName(value);
    },
    []
  );

  const handleSave = useCallback(
    (event: React.FormEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (name.length === 0) {
        setError(true);
        return;
      }

      // Update the redux state
      dispatch(setPresetName(name));

      // Persist locally and/or fire the onSave callback
      const didSave = LocalStorage.savePresetWithConfirmation({
        presetName: name,
        inventorySlots,
        equipmentSlots,
        relics,
        familiars
      });

      if (didSave) {
        enqueueSnackbar('Successfully saved your preset', {
          variant: 'success'
        });
        // Pass the new name back to the caller
        onSave?.(name);
      }

      onClose();
    },
    [name, inventorySlots, equipmentSlots, relics, familiars, dispatch, enqueueSnackbar, onSave, onClose]
  );

  const dialogTitle =
    state === SavePresetDialogState.ExistingPreset
      ? 'Save preset as'
      : 'Create new preset';

  return (
    <Dialog open={open} onClose={onClose}>
      <form>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <TextField
            className="name-field"
            label="Preset Name"
            value={name}
            onChange={onPresetNameChange}
            fullWidth
            error={error}
            helperText={error ? 'Please set a name for your preset.' : undefined}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
