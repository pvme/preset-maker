import React, { useEffect, useRef, useState } from 'react';
import { canCopyImagesToClipboard } from 'copy-image-clipboard';
import { useSnackbar } from 'notistack';

import Button from '@mui/material/Button';
import List from '@mui/material/List';

import { BreakdownHeader } from '../BreakdownHeader/BreakdownHeader';
import { BreakdownListItem } from '../BreakdownListItem/BreakdownListItem';
import { ClipboardCopyButtonContainer } from '../ClipboardCopyButtonContainer/ClipboardCopyButtonContainer';
import { useAppSelector } from '../../redux/hooks';
import { selectPreset } from '../../redux/store/reducers/preset-reducer';
import { type Item as ItemData } from '../../schemas/item-data';
import { BreakdownType } from '../../schemas/breakdown';
import {
  copyImageToClipboard,
  exportAsImage
} from '../../utility/export-to-png';

import './PresetBreakdown.css';

const customOrder: number[] = [0, 4, 6, 7, 8, 2, 9, 1, 3, 5, 10, 11, 12];

const clipboardSupported = canCopyImagesToClipboard();

export const PresetBreakdown = (): JSX.Element => {
  const exportRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  const {
    presetName: name,
    inventorySlots = [],
    equipmentSlots = []
  } = useAppSelector(selectPreset);

  const [mappedEquipment, setMappedEquipment] = useState<ItemData[]>([]);
  const [uniqueInventoryItems, setUniqueInventoryItems] = useState<ItemData[]>([]);
  const [lastValidInventory, setLastValidInventory] = useState<ItemData[]>([]);
  const [lastValidEquipment, setLastValidEquipment] = useState<ItemData[]>([]);

  useEffect(() => {
    if (inventorySlots.length > 0) {
      const filteredInventory = inventorySlots.filter(
        (item) => (item.label ?? '').length > 0
      );
      setLastValidInventory(filteredInventory);
    }

    if (equipmentSlots.length > 0) {
      setLastValidEquipment(equipmentSlots);
    }

    if (inventorySlots.length === 0 && equipmentSlots.length === 0) {
      console.warn('Skipping render update — received empty slot arrays');
      return;
    }

    const reorderedArray: ItemData[] = customOrder.map((orderIndex) => {
      return equipmentSlots[orderIndex] ?? {
        name: '',
        image: '',
        label: '',
        breakdownNotes: ''
      };
    });

    setMappedEquipment((prev) => {
      if (
        prev?.length === reorderedArray.length &&
        prev.every((item, i) => item.name === reorderedArray[i].name)
      ) {
        return prev;
      }
      return reorderedArray;
    });

    const uniqueItemData: ItemData[] = inventorySlots.filter((item, index, self) => {
      return (
        self.findIndex((i) => i.name === item.name) === index && item.name
      );
    });

    setUniqueInventoryItems((prev) => {
      if (
        prev?.length === uniqueItemData.length &&
        prev.every((item, i) => item.name === uniqueItemData[i].name)
      ) {
        return prev;
      }
      return uniqueItemData;
    });
  }, [inventorySlots, equipmentSlots]);

  return (
    <div className="breakdown-container">
      <div className="breakdown-inner-container" ref={exportRef}>
        <div className="equipment-breakdown-container--inventory">
          <List className="breakdown-list" dense>
            <BreakdownHeader />
            {lastValidInventory.map((item, i) => (
              <BreakdownListItem
                key={item.label + i}
                item={item}
                type={BreakdownType.Inventory}
              />
            ))}
          </List>
        </div>
        <div className="equipment-breakdown-container--equipment">
          <List className="breakdown-list" dense>
            <BreakdownHeader />
            {lastValidEquipment.map((item, i) =>
              (item.label ?? '').length > 0 ? (
                <BreakdownListItem
                  key={item.label + i}
                  item={item}
                  type={BreakdownType.Equipment}
                />
              ) : null
            )}
          </List>
        </div>
      </div>
    </div>
  );
};
