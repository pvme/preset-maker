import { useSnackbar } from "notistack";
import React, { useCallback, useState } from "react";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectPreset,
  setPresetName,
} from "../../redux/store/reducers/preset-reducer";

import { LocalStorage } from "../../store/local-storage";
import "./SavePresetDialog.css";

export enum SavePresetDialogState {
  None,
  NewPreset,
  ExistingPreset,
}

interface SavePresetDialogProps {
  open: boolean;
  state: SavePresetDialogState;
  onSave?: () => void;
  onClose: () => void;
}

export const SavePresetDialog = ({
  open,
  state,
  onSave,
  onClose,
}: SavePresetDialogProps) => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState<string>("");
  const [error, setError] = useState<boolean>();

  const {
    presetName: presetName,
    inventorySlots,
    equipmentSlots,
    relics,
    familiars,
  } = useAppSelector(selectPreset);

  const onPresetNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setError(!event.currentTarget.value);
      setName(event.currentTarget.value);
    },
    []
  );

  const handleSave = useCallback(
    (event: React.FormEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!name) {
        setError(true);
        return;
      }

      dispatch(setPresetName(name));

      const didSave = LocalStorage.savePresetWithConfirmation({
        presetName: name,
        inventorySlots,
        equipmentSlots,
        relics,
        familiars,
      });
      if (didSave) {
        enqueueSnackbar("Successfully saved your preset", {
          variant: "success",
        });
        if (onSave) {
          onSave();
        }
      }

      onClose();
    },
    [name, presetName, inventorySlots, equipmentSlots]
  );

  const dialogTitle =
    state === SavePresetDialogState.ExistingPreset
      ? "Save preset as"
      : "Create new preset";
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
            helperText={error && "Please set a name for your preset."}
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
