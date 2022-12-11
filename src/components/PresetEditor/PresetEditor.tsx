import React, { useCallback, useEffect, useRef, useState } from "react";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";

import {
  resetSlots,
  selectPreset,
  setEquipmentSlot,
  setInventorySlot,
} from "../../redux/store/reducers/preset-reducer";
import { addToQueue, selectRecentItems } from "../../redux/store/reducers/recent-item-reducer";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { ItemData } from "../../types/inventory-slot";
import { SlotType } from "../../types/slot-type";
import { exportAsImage } from "../../utility/export-to-png";
import { DialogPopup } from "../DialogPopup/DialogPopup";
import { Equipment, Inventory } from "../SlotSection/SlotSection";

import "./PresetEditor.css";

export const PresetEditor = () => {
  const dispatch = useAppDispatch();

  const { inventorySlots, equipmentSlots } = useAppSelector(selectPreset);
  const recentItems = useAppSelector(selectRecentItems);

  const exportRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const [inventoryOrEquipment, setInventoryOrEquipment] = useState<SlotType>(SlotType.Inventory);
  const [open, setOpen] = useState(false);

  const handleSlotSelection = useCallback(
    (_event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => {
      if (className === "inventory") {
        setInventoryOrEquipment(SlotType.Inventory);
      } else {
        setInventoryOrEquipment(SlotType.Equipment);
      }

      setSelectedIndex(index);
      setOpen(true);
    },
    [inventoryOrEquipment]
  );

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const changeSlot = useCallback(
    (index: number, item: ItemData) => {
      if (index === -1 || item === null) {
        console.error("error?");
        return;
      }

      if (inventoryOrEquipment === SlotType.Inventory) {
        dispatch(setInventorySlot({ index, item }));
      } else {
        dispatch(setEquipmentSlot({ index, item }));
      }
      dispatch(addToQueue(item));
    },
    [inventoryOrEquipment]
  );

  const onReset = useCallback(() => {
    dispatch(resetSlots());
  }, []);

  const onSave = useCallback(async () => {
    await exportAsImage(exportRef.current, "PRESET");
  }, []);

  return (
    <>
      <Card className="container">
        <CardContent data-id="content" className="preset-container">
          <div ref={exportRef}>
            <map name="presetmap">
              <Inventory slots={inventorySlots} handleClickOpen={handleSlotSelection} />
              <Equipment slots={equipmentSlots} handleClickOpen={handleSlotSelection} />
            </map>
            <img
              width={510}
              height={163}
              id="preset-background"
              src="https://i.imgur.com/O7VznNO.png"
              useMap="#presetmap"
              alt="preset background"
            />
          </div>
        </CardContent>
        <CardActions className="preset-buttons">
          <Button color="error" variant="contained" size="small" onClick={onReset}>
            Reset
          </Button>
          <Button color="success" variant="contained" size="small" onClick={onSave}>
            Save as PNG
          </Button>
        </CardActions>
      </Card>
      <DialogPopup
        open={open}
        selectedIndex={selectedIndex}
        recentlySelectedItems={recentItems}
        handleClose={handleClose}
        handleSlotChange={changeSlot}
      />
    </>
  );
};
