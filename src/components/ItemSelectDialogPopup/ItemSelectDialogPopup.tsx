import { useCallback, useState } from "react";
import fuzzysort from "fuzzysort";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Autocomplete, {
  AutocompleteChangeDetails,
  AutocompleteChangeReason,
  AutocompleteRenderInputParams,
  AutocompleteRenderOptionState,
} from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import DialogActions from "@mui/material/DialogActions";
import { FilterOptionsState } from "@mui/material/useAutocomplete";

import { ItemData } from "../../types/item-data";
import itemData from "../../data/sorted_items.json";

import "./ItemSelectDialogPopup.css";
import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";

interface DialogPopupProps {
  open: boolean;
  recentlySelectedItems: ItemData[];
  handleClose: () => void;
  handleSlotChange: (indices: number[], item: ItemData) => void;
}

const dialogBaseHeight = 170;
const dialogExpandedHeight = 450;

export const DialogPopup = ({
  open,
  recentlySelectedItems,
  handleClose,
  handleSlotChange,
}: DialogPopupProps) => {
  const { slotType, slotIndex, inventorySlots } = useAppSelector(selectPreset);

  const selectedInventorySlots = inventorySlots
    .map((slot: ItemData, index: number) => (slot.selected ? index : undefined))
    .filter((entry): entry is number => entry !== undefined);
  const selectedIndices = selectedInventorySlots.length
    ? selectedInventorySlots
    : [slotIndex];

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
    (options: ItemData[], state: FilterOptionsState<ItemData>): ItemData[] => {
      if (!state.inputValue) {
        return options;
      }

      const filteredOptions = fuzzysort.go<ItemData>(
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
      value: ItemData | null,
      _reason: AutocompleteChangeReason,
      _details?: AutocompleteChangeDetails<ItemData>
    ) => {
      if (value === null) {
        return;
      }

      handleSlotChange(selectedIndices, value);
      handleClose();
    },
    [slotType, selectedIndices]
  );

  const handleRecentClick = useCallback(
    (item: ItemData) => {
      handleSlotChange(selectedIndices, item);
      handleClose();
    },
    [slotType, selectedIndices]
  );

  const clearCell = useCallback(() => {
    handleSlotChange(selectedIndices, {
      name: "",
      image: "",
      label: "",
      breakdownNotes: "",
    });
    handleClose();
  }, [selectedIndices]);

  return (
    <Dialog
      classes={{
        paper: "dialog__paper",
      }}
      open={open}
      onClose={handleClose}
    >
      {selectedIndices.length > 1 ? (
        <DialogTitle>Assign multiple items</DialogTitle>
      ) : (
        <DialogTitle>Assign an item</DialogTitle>
      )}
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
          options={itemData}
          onOpen={handleAutocompleteOpen}
          onClose={handleAutocompleteClose}
          onChange={onChange}
          filterOptions={filterOptions}
          renderInput={(params: AutocompleteRenderInputParams) => (
            <TextField
              {...params}
              autoFocus
              label="Item list"
              inputProps={{
                ...params.inputProps,
                autoComplete: "new-password", // disable autocomplete and autofill
              }}
            />
          )}
          renderOption={(
            props: React.HTMLAttributes<HTMLLIElement>,
            option: ItemData,
            _state: AutocompleteRenderOptionState
          ) => (
            <Box
              key={`option-${option.name}`}
              className="image-container"
              component="li"
              {...props}
            >
              <img
                id={`option-${option.image}`}
                key={`option-${option.image}`}
                className="item-icon"
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
        {recentlySelectedItems.length > 0 && (
          <div className="recent-items-title">
            <Typography className="recent-items-title">
              Recent Items:
            </Typography>
            {recentlySelectedItems.map((item: ItemData) =>
              item.image ? (
                <Button
                  key={`recent-${item.name}`}
                  startIcon={
                    <Avatar
                      key={`recent-${item.image}`}
                      variant="square"
                      src={item.image}
                      className="avatar-icon"
                    />
                  }
                  onClick={() => handleRecentClick(item)}
                ></Button>
              ) : null
            )}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={clearCell}>
          Clear Cell
        </Button>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
