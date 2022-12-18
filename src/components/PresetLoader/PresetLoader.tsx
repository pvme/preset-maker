import Autocomplete, {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  AutocompleteRenderInputParams,
} from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import { useSnackbar } from "notistack";
import React, { useCallback, useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { importDataAction, selectPreset } from "../../redux/store/reducers/preset-reducer";
import { ImportData } from "../../types/import-data";
import { SavePresetDialogPopup } from "../SavePresetDialogPopup/SavePresetDialogPopup";

import "./PresetLoader.css";

export const PresetName = () => {
  const [presets, setPresets] = useState<ImportData[]>();
  const [presetNames, setPresetNames] = useState<string[]>();
  const [selectedPreset, setSelectedPreset] = useState<string>();
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);

  const { presetName } = useAppSelector(selectPreset);

  const { enqueueSnackbar } = useSnackbar();

  const dispatch = useAppDispatch();

  useEffect(() => {
    updateData();
  }, [presetName]);

  const updateData = useCallback(() => {
    const data = loadData();

    setPresets(data);
    setPresetNames(data.map((importData: ImportData) => importData.presetName || ""));
    setSelectedPreset(presetName);
  }, [presetName]);

  const loadData = () => {
    // load data from localStorage
    const lsPresets = window.localStorage.getItem("presets");
    if (lsPresets) {
      const itemData: ImportData[] = JSON.parse(lsPresets);
      return itemData;
    }

    return [];
  };

  const onPresetChange = useCallback(
    (
      _event: React.SyntheticEvent,
      value: string | null,
      _reason: AutocompleteChangeReason,
      _details?: AutocompleteChangeDetails<string>
    ) => {
      const preset = presets?.find((p) => p.presetName === value);
      if (!preset) {
        enqueueSnackbar("Unable to find preset", { variant: "error" });
        return;
      }

      dispatch(importDataAction(preset));
      enqueueSnackbar("Successfully loaded preset", { variant: "success" });
    },
    [presets]
  );

  const savePreset = useCallback(() => {
    setSaveDialogOpen(true);
  }, []);

  const removePreset = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, presetKey: string) => {
      // prevent default onClick behaviour
      event.preventDefault();
      event.stopPropagation();

      let data = loadData();
      // check to see if presetKey exists in localStorage
      if (data.find((d) => d.presetName.toLocaleUpperCase() === presetKey.toLocaleUpperCase())) {
        const confirm = window.confirm("Are you sure you wish to delete this preset?");
        if (!confirm) {
          return;
        }
      }

      // remove the preset from the localStorage
      data = data.filter((p) => p.presetName.toLocaleUpperCase() !== presetKey.toLocaleUpperCase());

      // overwrite the localStorage with removed data
      window.localStorage.setItem("presets", JSON.stringify(data));
      enqueueSnackbar("Successfully removed the preset", { variant: "success" });
      updateData();
    },
    [presets]
  );

  const handleDialogClose = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  return (
    <div className="input-group">
      <ButtonGroup>
        {presetNames && (
          <Autocomplete
            className="autocomplete-field"
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
                label="Load Preset"
                inputProps={{
                  ...params.inputProps,
                  autoComplete: "new-password", // disable autocomplete and autofill
                  className: "load-preset-field",
                }}
              />
            )}
            renderOption={(props: React.HTMLAttributes<HTMLLIElement>, option: string) => (
              <li {...props} className="option-list">
                {option}
                <IconButton onClick={(event) => removePreset(event, option)}>
                  <CloseIcon htmlColor="white" />
                </IconButton>
              </li>
            )}
          />
        )}
        <Button className="button" variant="contained" onClick={savePreset}>
          Save&nbsp;New&nbsp;Preset
        </Button>
      </ButtonGroup>
      <SavePresetDialogPopup
        open={saveDialogOpen}
        loadData={loadData}
        updateData={updateData}
        handleClose={handleDialogClose}
      />
    </div>
  );
};
