import React, { RefObject, useCallback, useRef, useState } from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  clearSlotSelection, selectPreset,
  setEquipmentSlot,
  setInventorySlot, toggleSlotSelection, updateSlotIndex,
  updateSlotType
} from "../../redux/store/reducers/preset-reducer";
import {
  addToQueue,
  selectRecentItems
} from "../../redux/store/reducers/recent-item-reducer";
import { ItemData } from "../../types/item-data";
import { SlotType } from "../../types/slot-type";
import { DialogPopup } from "../ItemSelectDialogPopup/ItemSelectDialogPopup";
import { Equipment, Inventory } from "../SlotSection/SlotSection";

import { FamiliarSection } from "../FamiliarSection/FamiliarSection";
import { RelicSection } from "../RelicSection/RelicSection";
import "./PresetEditor.css";
import { Typography } from "@mui/material";

export const PresetEditor = ({
  setExportRef
}: {
  setExportRef: (ref: HTMLDivElement) => void
}) => {
  const dispatch = useAppDispatch();

  const {
    inventorySlots,
    equipmentSlots,
    slotType,
    slotIndex,
  } = useAppSelector(selectPreset);
  const recentItems = useAppSelector(selectRecentItems);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSlotOpen = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      className: string
    ) => {
      if (className === "inventory") {
        dispatch(updateSlotType(SlotType.Inventory));
      } else {
        dispatch(updateSlotType(SlotType.Equipment));
      }

      // If a slot is opened that is not currently selected, clear the selected
      // slots.
      if (!inventorySlots[index].selected) {
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
      if (className === "inventory") {
        dispatch(updateSlotType(SlotType.Inventory));
      } else {
        dispatch(updateSlotType(SlotType.Equipment));
      }

      dispatch(toggleSlotSelection(index));
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
      <Card className="inventory-equipment-container">
        <CardContent data-id="content" className="preset-container">
          <div className="export-container" ref={setExportRef}>
            <map name="presetmap">
              <Inventory
                slots={inventorySlots}
                handleClickOpen={handleSlotOpen}
                handleShiftClick={handleSlotSelection}
              />
              <Equipment
                slots={equipmentSlots}
                handleClickOpen={handleSlotOpen}
              />
            </map>
            <img
              width={510}
              height={163}
              id="preset-background"
              src="https://i.imgur.com/O7VznNO.png"
              useMap="#presetmap"
              alt="preset background"
            />
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
