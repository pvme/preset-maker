// src/components/SavePresetDialog/SavePresetDialog.tsx

import React, { useCallback, useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
  Tooltip,
} from "@mui/material";

import { useAppDispatch } from "../../redux/hooks";
import { setPresetName } from "../../redux/store/reducers/preset-reducer";

import "./SavePresetDialog.css";

export enum SavePresetDialogState {
  None,
  NewPreset,
  ExistingPreset,
}

export type NewPresetMode = "duplicate" | "fresh";

interface SavePresetDialogProps {
  open: boolean;
  state: SavePresetDialogState;
  onSave?: (newName: string, mode: NewPresetMode) => void;
  onClose: () => void;
  defaultName?: string; // kept for compatibility
}

export const SavePresetDialog = ({
  open,
  state,
  onSave,
  onClose,
}: SavePresetDialogProps): JSX.Element => {
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<NewPresetMode>("duplicate");

  useEffect(() => {
    if (open) {
      setName("");
      setError(false);
      setMode("duplicate");
    }
  }, [open]);

  const onPresetNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.currentTarget.value;
      setName(value);
      setError(value.trim().length === 0);
    },
    []
  );

  const handleSave = useCallback(
    (event: React.FormEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const finalName = name.trim();
      if (!finalName) {
        setError(true);
        return;
      }

      dispatch(setPresetName(finalName));
      onSave?.(finalName, mode);
    },
    [name, mode, dispatch, onSave]
  );

  const dialogTitle =
    state === SavePresetDialogState.ExistingPreset
      ? "Save preset as"
      : "Create new preset";

  const canCreate = name.trim().length > 0;

  return (
    <Dialog open={open} onClose={onClose}>
      <form>
        <DialogTitle>{dialogTitle}</DialogTitle>

        <DialogContent sx={{ overflow: "visible", pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Preset Name"
              value={name}
              onChange={onPresetNameChange}
              fullWidth
              error={error}
              helperText={
                error ? "Please set a name for your preset." : undefined
              }
              autoFocus
            />

            <FormControl>
              <FormLabel>Starting point</FormLabel>
              <RadioGroup
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as NewPresetMode)
                }
              >
                <FormControlLabel
                  value="duplicate"
                  control={<Radio />}
                  label="Duplicate current preset"
                />
                <FormControlLabel
                  value="fresh"
                  control={<Radio />}
                  label="Start with a fresh preset"
                />
              </RadioGroup>

              <FormHelperText>
                New presets are created locally. Upload to cloud to
                share with others.
              </FormHelperText>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>

          <Tooltip
            title={
              canCreate
                ? ""
                : "Enter a preset name to enable creation"
            }
            disableHoverListener={canCreate}
            arrow
          >
            <span>
              <Button
                type="submit"
                onClick={handleSave}
                disabled={!canCreate}
              >
                Create
              </Button>
            </span>
          </Tooltip>
        </DialogActions>
      </form>
    </Dialog>
  );
};
