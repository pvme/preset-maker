import React, { useCallback, useEffect, useRef, useState } from 'react';
import { canCopyImagesToClipboard } from 'copy-image-clipboard';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import List from '@mui/material/List';

import { BreakdownHeader } from '../BreakdownHeader/BreakdownHeader';
import { BreakdownListItem } from '../BreakdownListItem/BreakdownListItem';
import { ClipboardCopyButtonContainer } from '../ClipboardCopyButtonContainer/ClipboardCopyButtonContainer';
import { useAppSelector } from '../../redux/hooks';
import { selectPreset } from '../../redux/store/reducers/preset-reducer';
import { type ItemData } from '../../types/item-data';
import { BreakdownType } from '../../types/breakdown';
import {
  copyImageToClipboard,
  exportAsImage
} from '../../utility/export-to-png';

import './PresetBreakdown.css';
import { FormControlLabel, Switch } from '@mui/material';
import { AppMode, getMode } from '../../redux/store/reducers/setting-reducer';

// This is used to map the equipmentSlots array (0-12) to a column
// Used in getMappedEquipment
const customOrder: number[] = [0, 4, 6, 7, 8, 2, 9, 1, 3, 5, 10, 11, 12];

const clipboardSupported = canCopyImagesToClipboard();

const itemHasBreakdownNotes = (item: ItemData): boolean => {
  if (item.breakdownNotes === undefined || item.breakdownNotes === null) {
    return false;
  }

  // Some necro items have a line break - those will be cleaned up
  return item.breakdownNotes.trim().length > 0 && item.breakdownNotes !== '<br />';
};

export const PresetBreakdown = (): JSX.Element => {
  const exportRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [mappedEquipment, setMappedEquipment] = useState<ItemData[]>();
  const [uniqueInventoryItems, setUniqueInventoryItems] =
    useState<ItemData[]>();

  const [hideEmptySlots, setHideEmptySlots] = useState(false);

  const mode = useAppSelector(getMode);
  const {
    presetName: name,
    inventorySlots,
    equipmentSlots
  } = useAppSelector(selectPreset);

  useEffect(() => {
    const getMappedEquipment = (): void => {
      const reorderedArray: ItemData[] = [];

      for (let i = 0; i < customOrder.length; i++) {
        const orderIndex = customOrder[i];
        reorderedArray[i] = equipmentSlots[orderIndex];
      }

      const filteredArray = reorderedArray
        .filter((item) => !hideEmptySlots || (itemHasBreakdownNotes(item)));

      setMappedEquipment(filteredArray);
    };

    const getUniqueInventoryItems = (): void => {
      const uniqueItemData = inventorySlots.filter((item, index, self) => {
        return (
          self.map((i) => i.name).indexOf(item.name) === index && item.name
        );
      });

      const filteredArray = uniqueItemData
        .filter((item) => !hideEmptySlots || (itemHasBreakdownNotes(item)));

      setUniqueInventoryItems(filteredArray);
    };

    getMappedEquipment();
    getUniqueInventoryItems();
  }, [inventorySlots, equipmentSlots, hideEmptySlots]);

  const exportBreakdown = useCallback(async () => {
    await exportAsImage(
      exportRef.current,
      `BREAK_DOWN_${name.replaceAll(' ', '_')}`

    );
  }, [name, exportRef]);

  const copyBreakdownToClipboard = useCallback(async () => {
    await copyImageToClipboard(exportRef.current, {}, {
      onSuccess: () => {
        enqueueSnackbar('Copied image to clipboard', {
          variant: 'success'
        });
      },
      onError: () => {
        enqueueSnackbar('Failed to copy image to clipboard', {
          variant: 'error'
        });
      }
    });
  }, [exportRef]);

  return (
    <div className="breakdown-container">
      <FormControlLabel
        control={<Switch onChange={(event) => { setHideEmptySlots(event.target.checked); }} />}
        label="Hide items without notes"
      />
      {mode === AppMode.Edit && (
      <div className="breakdown-header desktop-only">
        <Button
          className="breakdown-button"
          variant="contained"
          color="success"
          onClick={() => {
            void exportBreakdown();
          }}
        >
          Save Breakdown as PNG
        </Button>
        <ClipboardCopyButtonContainer className="breakdown-button">
          <Button
            variant="outlined"
            color="secondary"
            disabled={!clipboardSupported}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={copyBreakdownToClipboard}
          >
            Copy Breakdown to Clipboard
          </Button>
        </ClipboardCopyButtonContainer>
      </div>
      )}
      <div className="breakdown-inner-container" ref={exportRef}>
        <div className="equipment-breakdown-container--equipment">
          <List className="breakdown-list" dense>
            <BreakdownHeader />
            {mappedEquipment?.map(
              (item) =>
                ((item.label ?? '').length > 0) && (
                  <BreakdownListItem
                    mode={mode}
                    key={item.label}
                    item={item}
                    type={BreakdownType.Equipment}
                  />
                )
            )}
          </List>
        </div>
        <div className="equipment-breakdown-container--inventory">
          <List className="breakdown-list" dense>
            <BreakdownHeader />
            {(uniqueInventoryItems ?? []).map((item) => {
              return (
                  <BreakdownListItem
                    mode={mode}
                    key={item.label}
                    item={item}
                    type={BreakdownType.Inventory}
                  />
              );
            })}
          </List>
        </div>
      </div>
    </div>
  );
};
