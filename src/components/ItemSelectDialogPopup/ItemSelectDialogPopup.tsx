import React, { useCallback, useEffect, useState } from 'react';
import fuzzysort from 'fuzzysort';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Autocomplete, {
  type AutocompleteChangeDetails,
  type AutocompleteChangeReason,
  type AutocompleteRenderInputParams,
  type AutocompleteRenderOptionState
} from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import { type FilterOptionsState } from '@mui/material/useAutocomplete';

import { type ItemData } from '../../types/item-data';
import itemData from '../../data/sorted_items.json';
import { useAppSelector } from '../../redux/hooks';
import { selectPreset } from '../../redux/store/reducers/preset-reducer';
import { ItemType, SlotType } from '../../types/slot-type';

import './ItemSelectDialogPopup.css';
interface DialogPopupProps {
  open: boolean
  recentlySelectedItems: ItemData[]
  handleClose: () => void
  handleSlotChange: (indices: number[], item: ItemData) => void
}

const dialogBaseHeight = 170;
const dialogExpandedHeight = 450;

const slotIndexToSlotEnumMap = new Map<number, ItemType>([
  [0, ItemType.HELM],
  [1, ItemType.CAPE],
  [2, ItemType.NECKLACE],
  [3, ItemType.MH_WEAPON],
  [4, ItemType.BODY],
  [5, ItemType.OH_WEAPON],
  [6, ItemType.LEGS],
  [7, ItemType.GLOVES],
  [8, ItemType.BOOTS],
  [9, ItemType.RING],
  [10, ItemType.AMMO],
  [11, ItemType.AURA],
  [12, ItemType.POCKET]
]);

export const DialogPopup = ({
  open,
  recentlySelectedItems,
  handleClose,
  handleSlotChange
}: DialogPopupProps): JSX.Element => {
  const { slotType, slotIndex, inventorySlots } = useAppSelector(selectPreset);
  const [filteredItemData, setFilteredItemData] = useState<ItemData[]>(itemData);

  // Helper function for filtering.
  const filterItemsForSlotType = (selectedSlotType: SlotType, selectedSlotIndex: number, items: ItemData[]): ItemData[] => {
    // For inventory, filter out auras.
    if (selectedSlotType === SlotType.Inventory) {
      return items.filter((item) => item.slot !== ItemType.AURA);
    } else {
      return items.filter((item) => item.slot === slotIndexToSlotEnumMap.get(selectedSlotIndex));
    }
  };

  // Ensure that recent items aren't for a different slot.
  const filteredRecentItems = filterItemsForSlotType(slotType, slotIndex, recentlySelectedItems);

  useEffect(() => {
    setFilteredItemData(filterItemsForSlotType(slotType, slotIndex, itemData));
  }, [itemData, slotType, slotIndex]);

  const selectedInventorySlots = inventorySlots
    .map((slot: ItemData, index: number) => (slot.selected === true ? index : undefined))
    .filter((entry): entry is number => entry !== undefined);
  const selectedIndices = (selectedInventorySlots.length > 0)
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
      if (state.inputValue.length === 0) {
        return options;
      }

      const filteredOptions = fuzzysort.go<ItemData>(
        state.inputValue,
        options,
        {
          limit: 100,
          threshold: -100,
          keys: ['name', 'label']
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
      name: '',
      image: '',
      label: '',
      breakdownNotes: ''
    });
    handleClose();
  }, [selectedIndices]);

  return (
    <Dialog
      classes={{
        paper: 'dialog__paper'
      }}
      open={open}
      onClose={handleClose}
    >
      {selectedIndices.length > 1
        ? (
        <DialogTitle>Assign multiple items</DialogTitle>
          )
        : (
        <DialogTitle>Assign an item</DialogTitle>
          )}
      <DialogContent
        className="dialog__content"
        sx={{
          height: dialogHeight
        }}
      >
        <Autocomplete
          className="dialog__auto-complete"
          disablePortal
          autoHighlight
          autoComplete
          options={filteredItemData}
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
                autoComplete: 'new-password' // disable autocomplete and autofill
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
        {filteredRecentItems.length > 0 && (
          <div className="recent-items-title">
            <Typography className="recent-items-title">
              Recent Items
            </Typography>
            {filteredRecentItems.map((item: ItemData) =>
              (item.image.length > 0)
                ? (
                <Tooltip key={item.name} title={item.name}>
                  <Button
                    classes={{
                      startIcon: 'recent-item-button'
                    }}
                    key={`recent-${item.name}`}
                    startIcon={
                      <Avatar
                        key={`recent-${item.image}`}
                        variant="square"
                        src={item.image}
                        classes={{
                          img: 'recent-item-image'
                        }}
                      />
                    }
                    onClick={() => { handleRecentClick(item); }}
                  ></Button>
                </Tooltip>
                  )
                : null
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
