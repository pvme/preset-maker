import React, { useCallback, useState } from "react";
import { useSnackbar } from "notistack";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, setPresetName } from "../../redux/store/reducers/preset-reducer";
import { ImportData } from "../../types/import-data";
import { sanitizedData } from "../../utility/sanitizer";

import "./SavePresetDialog.css";
import localStorage from "../../store/local-storage";

interface SavePresetDialogProps {
  open: boolean;
  updatePresets: () => void;
  handleClose: () => void;
}

export const SavePresetDialog = ({ open, updatePresets, handleClose }: SavePresetDialogProps) => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState<string>("");
  const [error, setError] = useState<boolean>();

  const { presetName: presetName, inventorySlots, equipmentSlots } = useAppSelector(selectPreset);


  const onPresetNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setError(!event.currentTarget.value);
    setName(event.currentTarget.value);
  }, []);

  const handleSave = useCallback(
    (event: React.FormEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (!name) {
        setError(true);
        return;
      }

      dispatch(setPresetName(name));

      const data = sanitizedData(inventorySlots, equipmentSlots);
      const currentData = localStorage.loadPresets();

      if (currentData.find((d) => d.presetName.toLocaleUpperCase() === name.toLocaleUpperCase())) {
        const confirm = window.confirm(
          "A preset with this name already exists, are you sure you wish to overwrite it?"
        );
        if (!confirm) {
          return;
        }
      }

      currentData.push({
        presetName: name,
        inventorySlots: data.inventory,
        equipmentSlots: data.equipment,
      });

      // TODO Move to LocalStorage class
      window.localStorage.setItem("presets", JSON.stringify(currentData));
      enqueueSnackbar("Successfully saved your preset", { variant: "success" });
      updatePresets();
      handleClose();
    },
    [name, presetName, inventorySlots, equipmentSlots]
  );

  return (
    <Dialog open={open} onClose={handleClose}>
      <form>
        {/* TODO Change based on prop */}
        <DialogTitle>Save new preset</DialogTitle>
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
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
