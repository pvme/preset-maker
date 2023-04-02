import fuzzysort from "fuzzysort";
import { useCallback, useState } from "react";

import Autocomplete, {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  AutocompleteRenderInputParams,
  AutocompleteRenderOptionState
} from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { FilterOptionsState } from "@mui/material/useAutocomplete";

import sortedRelics from "../../data/sorted_relics.json";
import { RelicData } from "../../types/relics";
import "./RelicSelectDialogPopup.css";
import { SelectionDetails } from "../RelicSection/RelicSection";

interface RelicSelectDialogPopupProps {
  open: boolean;
  selectionDetails: SelectionDetails;
  handleClose: () => void;
  handleSelection: (selectionDetails: SelectionDetails, relic: RelicData) => void;
}

const dialogBaseHeight = 130;
const dialogExpandedHeight = 400;

export const RelicSelectDialogPopup = ({
  open,
  selectionDetails,
  handleClose,
  handleSelection,
}: RelicSelectDialogPopupProps) => {
  const [dialogHeight, setDialogHeight] = useState(
    // Initialize dialogHeight state with the value of the dialogBaseHeight
    // constant.
    dialogBaseHeight
  );

  const handleAutocompleteOpen = useCallback(() => {
    // Update the height of the Dialog box to fit the options dropdown of the Autocomplete component
    setDialogHeight(dialogExpandedHeight);
  }, [dialogExpandedHeight]);

  const handleAutocompleteClose = useCallback(() => {
    // Update the height of the Dialog box to the default height
    setDialogHeight(dialogBaseHeight);
  }, [dialogBaseHeight]);

  const filterOptions = useCallback(
    (options: RelicData[], state: FilterOptionsState<RelicData>): RelicData[] => {
      if (!state.inputValue) {
        return options;
      }

      const filteredOptions = fuzzysort.go<RelicData>(
        state.inputValue,
        options,
        {
          limit: 100,
          threshold: -100,
          keys: ["name", "label"],
        }
      );

      return Array.from(filteredOptions).map((i) => i.obj);
    },
    []
  );

  const onChange = useCallback(
    (
      _event: React.SyntheticEvent,
      value: RelicData | null,
      _reason: AutocompleteChangeReason,
      _details?: AutocompleteChangeDetails<RelicData>
    ) => {
      if (value === null) {
        return;
      }

      handleSelection(selectionDetails, value);
      handleClose();
    },
    [selectionDetails]
  );

  const clearCell = useCallback(() => {
    handleSelection(selectionDetails, {
      name: "",
      image: "",
      label: "",
      breakdownNotes: "",
    });
    handleClose();
  }, [selectionDetails]);

  return (
    <Dialog
      classes={{
        paper: "dialog__paper",
      }}
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>Assign a relic</DialogTitle>
      <DialogContent
        className="dialog__content"
        sx={{
          height: dialogHeight,
        }}
      >
        <Autocomplete
          className="dialog__auto-complete"
          disablePortal
          autoHighlight
          autoComplete
          options={sortedRelics}
          onOpen={handleAutocompleteOpen}
          onClose={handleAutocompleteClose}
          onChange={onChange}
          filterOptions={filterOptions}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              autoFocus
              label="Relic list"
              inputProps={{
                ...params.inputProps,
                autoComplete: "new-password", // disable autocomplete and autofill
              }}
            />
          )}
          renderOption={(
            props: React.HTMLAttributes<HTMLLIElement>,
            option: RelicData,
            _state: AutocompleteRenderOptionState
          ) => (
            <Box
              key={`option-${option.name}`}
              component="li"
              {...props}
            >
              <img
                id={`option-${option.image}`}
                key={`option-${option.image}`}
                className="dialog__list__image"
                loading="lazy"
                width={20}
                src={option.image}
                srcSet={`${option.image} 2x`}
                alt=""
              />
              {option.name}
            </Box>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={clearCell}>
          Clear Relic
        </Button>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
