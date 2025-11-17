// src/components/ItemSelectDialogPopup.tsx

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

import { type Item as ItemData } from '../../schemas/item-data';
import itemData from '../../data/sorted_items.json';
import { useAppSelector } from '../../redux/hooks';
import { selectPreset } from '../../redux/store/reducers/preset-reducer';
import { ItemType, SlotType } from '../../schemas/slot-type';

import './ItemSelectDialogPopup.css';

interface DialogPopupProps {
  open: boolean
  recentlySelectedItems?: ItemData[]
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
  recentlySelectedItems = [],
  handleClose,
  handleSlotChange
}: DialogPopupProps): JSX.Element => {
  const {
    slotType,
    slotIndex,
    inventorySlots = []
  } = useAppSelector(selectPreset);
  const [filteredItemData, setFilteredItemData] = useState<ItemData[]>(itemData);

  const filterItemsForSlotType = (
    selectedSlotType: SlotType,
    selectedSlotIndex: number,
    items: ItemData[]
  ): ItemData[] => {
    if (selectedSlotType === SlotType.Inventory) {
      return items.filter((item) => item.slot !== ItemType.AURA);
    } else {
      return items.filter((item) => item.slot === slotIndexToSlotEnumMap.get(selectedSlotIndex));
    }
  };

  const filteredRecentItems = filterItemsForSlotType(slotType, slotIndex, recentlySelectedItems);

  useEffect(() => {
    setFilteredItemData(filterItemsForSlotType(slotType, slotIndex, itemData));
  }, [itemData, slotType, slotIndex]);

  const selectedInventorySlots = (inventorySlots || [])
    .map((slot: ItemData, index: number) => (slot.selected === true ? index : undefined))
    .filter((entry): entry is number => entry !== undefined);

  const selectedIndices = selectedInventorySlots.length > 0
    ? selectedInventorySlots
    : [slotIndex];

  const [dialogHeight, setDialogHeight] = useState(dialogBaseHeight);

  const handleAutocompleteOpen = useCallback(() => {
    setDialogHeight(dialogExpandedHeight);
  }, []);

  const handleAutocompleteClose = useCallback(() => {
    setDialogHeight(dialogBaseHeight);
  }, []);

  const filterOptions = useCallback(
    (options: ItemData[], state: FilterOptionsState<ItemData>): ItemData[] => {
      if (state.inputValue.length === 0) return options;

      const filteredOptions = fuzzysort.go<ItemData>(
        state.inputValue,
        options,
        {
          limit: 100,
          threshold: -100,
          keys: ['name', 'label']
        }
      );

      return filteredOptions.map((i) => i.obj);
    },
    []
  );

  const onChange = useCallback(
    (_event: React.SyntheticEvent, value: ItemData | null) => {
      if (value) {
        handleSlotChange(selectedIndices, value);
        handleClose();
      }
    },
    [selectedIndices, handleSlotChange, handleClose]
  );

  const handleRecentClick = useCallback(
    (item: ItemData) => {
      handleSlotChange(selectedIndices, item);
      handleClose();
    },
    [selectedIndices, handleSlotChange, handleClose]
  );

  const clearCell = useCallback(() => {
    handleSlotChange(selectedIndices, {
      name: '',
      image: '',
      label: '',
      breakdownNotes: '',
      wikiLink: '',
      selected: false
    });
    handleClose();
  }, [selectedIndices, handleSlotChange, handleClose]);

  const omitKey = <T extends object>(props: T): Omit<T, 'key'> => {
    const { key, ...rest } = props as any;
    return rest;
  };

  return (
    <Dialog
      classes={{ paper: 'dialog__paper' }}
      open={open}
      onClose={handleClose}
    >
      <DialogTitle>
        {selectedIndices.length > 1 ? 'Assign multiple items' : 'Assign an item'}
      </DialogTitle>
      <DialogContent
        className="dialog__content"
        sx={{ height: dialogHeight }}
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
                autoComplete: 'new-password'
              }}
            />
          )}
          renderOption={(
            props: React.HTMLAttributes<HTMLLIElement>,
            option: ItemData
          ) => (
            <Box
              key={`${option.name}-${option.image}`}
              className="image-container"
              component="li"
              {...omitKey(props)}
            >
              <img
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
            <Typography className="recent-items-title">Recent Items</Typography>
            {filteredRecentItems.map((item: ItemData) =>
              item.image.length > 0 ? (
                <Tooltip key={item.name} title={item.name}>
                  <Button
                    className="recent-item-button"
                    key={`recent-${item.name}`}
                    startIcon={
                      <Avatar
                        key={`recent-${item.image}`}
                        variant="square"
                        src={item.image}
                        className="recent-item-image"
                      />
                    }
                    onClick={() => handleRecentClick(item)}
                  />
                </Tooltip>
              ) : null
            )}
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={clearCell}>Clear Cell</Button>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
