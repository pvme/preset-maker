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

import "./SavePresetDialogPopup.css";

interface SavePresetDialogPopupProps {
  open: boolean;
  loadData: () => ImportData[];
  updateData: () => void;
  handleClose: () => void;
}

export const SavePresetDialogPopup = ({ open, loadData, updateData, handleClose }: SavePresetDialogPopupProps) => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [name, setName] = useState<string>("");
  const [error, setError] = useState<boolean>();

  const { presetName: presetName, inventorySlots, equipmentSlots, relics, familiars } = useAppSelector(selectPreset);

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

      const data = sanitizedData(inventorySlots, equipmentSlots, relics, familiars);
      const currentData = loadData();

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

      window.localStorage.setItem("presets", JSON.stringify(currentData));
      enqueueSnackbar("Successfully saved your preset", { variant: "success" });
      updateData();
      handleClose();
    },
    [name, presetName, inventorySlots, equipmentSlots]
  );

  return (
    <Dialog open={open} onClose={handleClose}>
      <form>
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
