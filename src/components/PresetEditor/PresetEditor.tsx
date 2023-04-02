import React, { useCallback, useRef, useState } from "react";

import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import { canCopyImagesToClipboard } from "copy-image-clipboard";
import {
  resetSlots,
  selectPreset,
  setEquipmentSlot,
  setInventorySlot,
  updateSlotIndex,
  updateSlotType,
  toggleSlotSelection,
  clearSlotSelection,
} from "../../redux/store/reducers/preset-reducer";
import {
  addToQueue,
  selectRecentItems,
} from "../../redux/store/reducers/recent-item-reducer";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { ItemData } from "../../types/inventory-slot";
import { SlotType } from "../../types/slot-type";
import {
  copyImageToClipboard,
  exportAsImage,
} from "../../utility/export-to-png";
import { DialogPopup } from "../ItemSelectDialogPopup/ItemSelectDialogPopup";
import { Equipment, Inventory } from "../SlotSection/SlotSection";

import "./PresetEditor.css";
import { ClipboardCopyButtonContainer } from "../ClipboardCopyButtonContainer/ClipboardCopyButtonContainer";
import { useSnackbar } from "notistack";
import { ResetConfirmation } from "../ResetConfirmation/ResetConfirmation";
import { RelicSection } from "../RelicSection/RelicSection";
import { FamiliarSection } from "../FamiliarSection/FamiliarSection";

export const PresetEditor = () => {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const {
    presetName: name,
    inventorySlots,
    equipmentSlots,
    relics,
    slotType,
    slotIndex,
  } = useAppSelector(selectPreset);
  const recentItems = useAppSelector(selectRecentItems);

  const exportRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

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

  const onResetClick = useCallback(() => {
    setConfirmationOpen(true);
  }, []);

  const onResetConfirmation = useCallback(() => {
    dispatch(resetSlots());
    setConfirmationOpen(false);
  }, [dispatch]);

  const onResetClose = useCallback(() => {
    setConfirmationOpen(false);
  }, []);

  const onSave = useCallback(async () => {
    await exportAsImage(
      exportRef.current,
      `PRESET_${name.replaceAll(" ", "_")}`
    );
  }, [name]);

  const onCopyToClipboard = useCallback(async () => {
    await copyImageToClipboard(exportRef.current, () => {
      enqueueSnackbar("Failed to copy image to clipboard", {
        variant: "error",
      });
    });
  }, []);

  return (
    <>
      <ResetConfirmation
        open={confirmationOpen}
        handleConfirmation={onResetConfirmation}
        handleClose={onResetClose}
      />
      <Card className="inventory-equipment-container">
        <CardContent data-id="content" className="preset-container">
          <div className="export-container" ref={exportRef}>
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
        <CardActions className="preset-buttons">
          <Button
            color="error"
            variant="contained"
            size="small"
            onClick={onResetClick}
          >
            Reset
          </Button>
          <Button
            color="success"
            variant="contained"
            size="small"
            onClick={onSave}
          >
            Save as PNG
          </Button>
          <ClipboardCopyButtonContainer className="preset-buttons__button">
            <Button
              color="secondary"
              variant="outlined"
              size="small"
              disabled={!canCopyImagesToClipboard()}
              onClick={onCopyToClipboard}
            >
              Copy Image to Clipboard
            </Button>
          </ClipboardCopyButtonContainer>
        </CardActions>
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
