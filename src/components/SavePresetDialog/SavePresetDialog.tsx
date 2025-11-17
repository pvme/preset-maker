import { useSnackbar } from 'notistack';
import React, { useCallback, useState, useEffect } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';

import { useAppDispatch } from '../../redux/hooks';
import { setPresetName } from '../../redux/store/reducers/preset-reducer';
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
  defaultName?: string;
}

export const SavePresetDialog = ({
  open,
  state,
  onSave,
  onClose,
  defaultName
}: SavePresetDialogProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState<string>(defaultName || '');
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setName(defaultName || '');
      setError(false);
    }
  }, [open, defaultName]);

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

      dispatch(setPresetName(name));
      onSave?.(name);
      enqueueSnackbar('Preset name set.', { variant: 'success' });
      onClose();
    },
    [name, dispatch, onSave, onClose, enqueueSnackbar]
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
