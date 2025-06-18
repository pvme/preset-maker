import React, { useCallback, useState } from 'react';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  clearSlotSelection, selectPreset,
  setEquipmentSlot,
  setInventorySlot, swapInventorySlots, toggleSlotSelection, updateSlotIndex,
  updateSlotType
} from '../../redux/store/reducers/preset-reducer';
import {
  addToQueue,
  selectRecentItems
} from '../../redux/store/reducers/recent-item-reducer';
import { type Item as ItemData } from '../../schemas/item-data';
import { SlotType } from '../../schemas/slot-type';
import { DialogPopup } from '../ItemSelectDialogPopup/ItemSelectDialogPopup';
import { Equipment, Inventory } from '../SlotSection/SlotSection';

import { FamiliarSection } from '../FamiliarSection/FamiliarSection';
import { RelicSection } from '../RelicSection/RelicSection';
import './PresetEditor.css';
import genericBackground from '../../assets/bg_large.png';
import mobilePresetMapBackground from '../../assets/presetmap_mobile.png';

export const PresetEditor = (): JSX.Element => {
  const dispatch = useAppDispatch();

  const {
    inventorySlots,
    equipmentSlots,
    slotType,
    slotIndex
  } = useAppSelector(selectPreset);
  const recentItems = useAppSelector(selectRecentItems);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSlotOpen = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      className: string
    ) => {
      if (className === 'inventory') {
        dispatch(updateSlotType(SlotType.Inventory));
      } else {
        dispatch(updateSlotType(SlotType.Equipment));
      }

      // If a slot is opened that is not currently selected, clear the selected
      // slots.
      if (!(inventorySlots[index].selected ?? false)) {
        dispatch(clearSlotSelection());
      }

      dispatch(updateSlotIndex(index));
      setDialogOpen(true);
    },
    [dispatch, inventorySlots]
  );

  const handleSlotSelection = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      className: string
    ) => {
      if (className === 'inventory') {
        dispatch(updateSlotType(SlotType.Inventory));
      } else {
        dispatch(updateSlotType(SlotType.Equipment));
      }

      dispatch(toggleSlotSelection(index));
    },
    [dispatch]
  );

  const handleInventoryDragAndDrop = useCallback(
    (
      sourceIndex: number,
      targetIndex: number
    ) => {
      dispatch(swapInventorySlots({
        sourceIndex,
        targetIndex
      }));
    },
    [dispatch]
  );

  const onDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const changeSlot = useCallback(
    (indices: number[], item: ItemData) => {
      indices.forEach((index) => {
        if (index === -1) {
          return;
        }

        if (slotType === SlotType.Inventory) {
          dispatch(setInventorySlot({ index, value: item }));
        } else {
          dispatch(setEquipmentSlot({ index, value: item }));
        }
      });

      dispatch(addToQueue(item));
      dispatch(clearSlotSelection());
    },
    [dispatch, slotType, slotIndex]
  );

  return (
    <>
      <Card className="preset-editor__card">
        <CardContent data-id="content" className="preset-container">
          <div className="preset-editor__export-container">
            <div className="preset-map-container" style={{
              backgroundImage: `url(${genericBackground})`
            }}>
              <map name="presetmap" className="preset-map">
                <Inventory
                  slots={inventorySlots}
                  handleClickOpen={handleSlotOpen}
                  handleShiftClick={handleSlotSelection}
                  handleDragAndDrop={handleInventoryDragAndDrop}
                />
                <Equipment
                  slots={equipmentSlots}
                  handleClickOpen={handleSlotOpen}
                />
                <img
                  width={510}
                  height={163}
                  src="https://img.pvme.io/images/O7VznNO.png"
                  useMap="#presetmap"
                  alt="preset background"
                  className="desktop-only"
                />
                <div className="preset-image-container mobile-only">
                  <img
                    width={183}
                    height={512}
                    src={mobilePresetMapBackground}
                    useMap="#presetmap"
                    alt="preset background"
                  />
                </div>
              </map>
            </div>
            <div className="relics-familiar-container">
              <RelicSection />
              <FamiliarSection />
            </div>
          </div>
        </CardContent>
      </Card>
      <DialogPopup
        open={dialogOpen}
        recentlySelectedItems={recentItems}
        handleClose={onDialogClose}
        handleSlotChange={changeSlot}
      />
    </>
  );
};
