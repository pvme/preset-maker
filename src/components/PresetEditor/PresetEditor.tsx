// src/components/PresetEditor/PresetEditor.tsx

import React, { useCallback, useState } from "react";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  toggleSlotSelection,
  clearSelectedSlots,
  selectPreset,
  setEquipmentSlot,
  setInventorySlot,
  swapInventorySlots,
  updateSlotIndex,
  updateSlotType,
  updateSlotKey,
} from "../../redux/store/reducers/preset-reducer";

import {
  addToQueue,
  selectRecentItems,
} from "../../redux/store/reducers/recent-item-reducer";

import { type Item as ItemData } from "../../schemas/item-data";
import { SlotType } from "../../schemas/slot-type";

import { EmojiSelectDialog } from "../EmojiSelectDialog/EmojiSelectDialog";

import { Equipment, Inventory } from "../SlotSection/SlotSection";

import { FamiliarSection } from "../FamiliarSection/FamiliarSection";
import { RelicSection } from "../RelicSection/RelicSection";

import "./PresetEditor.css";
import genericBackground from "../../assets/bg_large.png";
import mobilePresetMapBackground from "../../assets/presetmap_mobile.png";
import { useEmojiMap } from "../../hooks/useEmojiMap";

export const PresetEditor = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const maps = useEmojiMap();

  const {
    inventorySlots,
    equipmentSlots,
    slotType,
    selectedSlots,
    slotIndex,
  } = useAppSelector(selectPreset);

  const recentItems = useAppSelector(selectRecentItems);

  const [dialogOpen, setDialogOpen] = useState(false);

  //
  // SHIFT-CLICK — toggles selection only (inventory only)
  //
  const handleSlotSelection = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      slotGroup: string
    ) => {
      const key = `${slotGroup}:${index}`;

      // Equipment slots can never be multi-selected
      if (slotGroup !== "inventory") {
        // Turn into a clean single-select
        dispatch(clearSelectedSlots());
        dispatch(toggleSlotSelection(key));
        dispatch(updateSlotKey(key));
        dispatch(updateSlotIndex(index));
        dispatch(updateSlotType(SlotType.Equipment));
        return;
      }

      // Prevent mixing groups: if anything selected that's not inventory → reset
      const hasNonInventory = selectedSlots.some(k => !k.startsWith("inventory"));
      if (hasNonInventory) {
        dispatch(clearSelectedSlots());
      }

      // Normal inventory multi-select
      dispatch(updateSlotType(SlotType.Inventory));
      dispatch(toggleSlotSelection(key));
      dispatch(updateSlotKey(key));
      dispatch(updateSlotIndex(index));
    },
    [dispatch, selectedSlots]
  );


  //
  // SLOT CLICK — Opens dialog and selects only that slot
  //
  const handleSlotOpen = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      slotGroup: string
    ) => {
      const key = `${slotGroup}:${index}`;

      // If clicking a slot *already in* a multi-selection → keep the multi-selection
      const isInSelection = selectedSlots.includes(key);
      const inInventoryMulti =
        selectedSlots.length > 1 &&
        selectedSlots.every(k => k.startsWith("inventory"));

      dispatch(updateSlotType(
        slotGroup === "inventory" ? SlotType.Inventory : SlotType.Equipment
      ));

      if (isInSelection && inInventoryMulti) {
        // Keep multi-selection and open the dialog
        dispatch(updateSlotKey(key));
        dispatch(updateSlotIndex(index));
        setDialogOpen(true);
        return;
      }

      // Otherwise: normal single-select behaviour
      dispatch(clearSelectedSlots());
      dispatch(toggleSlotSelection(key));
      dispatch(updateSlotKey(key));
      dispatch(updateSlotIndex(index));
      setDialogOpen(true);
    },
    [dispatch, selectedSlots]
  );



  //
  // preset_slot → UI equipment slot mapping
  //
  const presetToUI: Record<number, number> = {
    1: 0,   // HELM
    12: 1,  // CAPE
    10: 2,  // NECKLACE
    4: 3,   // MH_WEAPON
    2: 4,   // BODY
    5: 5,   // OH_WEAPON
    3: 6,   // LEGS
    6: 7,   // GLOVES
    7: 8,   // BOOTS
    11: 9,  // RING
    9: 10,  // AMMO
    8: 11,  // AURA
    13: 12, // POCKET
  };

  //
  // DRAG & DROP — inventory ↔ equipment
  //
  const handleDragAndDrop = useCallback(
    (
      dragItem: { fromGroup: string; index: number; id: string },
      targetGroup: string,
      targetIndex: number
    ) => {
      const from = dragItem.fromGroup;
      const to = targetGroup;

      if (!dragItem.id) return;

      const entry = maps?.get(dragItem.id);
      const presetSlot = entry?.preset_slot ?? 0;

      const uiSlot = presetToUI[presetSlot] ?? -1;

      //
      // Inventory → Equipment
      //
      if (from === "inventory" && to === "equipment") {
        if (uiSlot !== targetIndex) return;

        dispatch(setEquipmentSlot({ index: targetIndex, value: { id: dragItem.id } }));
        dispatch(setInventorySlot({ index: dragItem.index, value: { id: "" } }));
        return;
      }

      //
      // Equipment → Inventory
      //
      if (from === "equipment" && to === "inventory") {
        dispatch(setInventorySlot({ index: targetIndex, value: { id: dragItem.id } }));
        dispatch(setEquipmentSlot({ index: dragItem.index, value: { id: "" } }));
        return;
      }

      //
      // Equipment → Equipment
      //
      if (from === "equipment" && to === "equipment") {
        if (uiSlot !== targetIndex) return;

        dispatch(setEquipmentSlot({ index: targetIndex, value: { id: dragItem.id } }));
        dispatch(setEquipmentSlot({ index: dragItem.index, value: { id: "" } }));
        return;
      }

      //
      // Inventory → Inventory
      //
      if (from === "inventory" && to === "inventory") {
        dispatch(swapInventorySlots({ sourceIndex: dragItem.index, targetIndex }));
        return;
      }
    },
    [dispatch, maps, presetToUI]
  );

  //
  // CLOSE dialog
  //
  const onDialogClose = useCallback(() => {
    setDialogOpen(false);
    dispatch(clearSelectedSlots());
  }, [dispatch]);


  //
  // APPLY chosen emoji/item to all selected slots
  //
  const changeSlot = useCallback(
    (indices: string[], item: ItemData) => {
      indices.forEach((key) => {
        const [group, raw] = key.split(":");
        const index = Number(raw);
        if (index < 0) return;

        if (group === "inventory") {
          dispatch(setInventorySlot({ index, value: item }));
        } else {
          dispatch(setEquipmentSlot({ index, value: item }));
        }
      });

      dispatch(addToQueue(item));
      dispatch(clearSelectedSlots());
    },
    [dispatch]
  );

  return (
    <>
      <Card className="preset-editor__card">
        <CardContent data-id="content" className="preset-container">
          <div className="preset-editor__export-container">
            <div
              className="preset-map-container"
              style={{ backgroundImage: `url(${genericBackground})` }}
            >
              <map name="presetmap" className="preset-map">

                {/* INVENTORY */}
                <Inventory
                  slots={inventorySlots}
                  handleClickOpen={handleSlotOpen}
                  handleShiftClick={handleSlotSelection}
                  handleDragAndDrop={handleDragAndDrop}
                />

                {/* EQUIPMENT */}
                <Equipment
                  slots={equipmentSlots}
                  handleClickOpen={handleSlotOpen}
                  handleShiftClick={handleSlotSelection}
                  handleDragAndDrop={handleDragAndDrop}
                />

                {/* Background images */}
                <img
                  width={510}
                  height={163}
                  src="https://img.pvme.io/images/O7VznNO.png"
                  useMap="#presetmap"
                  alt="preset"
                  className="desktop-only"
                />

                <div className="preset-image-container mobile-only">
                  <img
                    width={183}
                    height={512}
                    src={mobilePresetMapBackground}
                    useMap="#presetmap"
                    alt="preset mobile"
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

      {/* EMOJI SELECTOR */}
      <EmojiSelectDialog
        open={dialogOpen}
        onClose={onDialogClose}
        onSelect={(ids) => changeSlot(selectedSlots as string[], { id: ids[0] })}
        slotType={slotType}
        slotIndex={slotIndex}
        slotKey={selectedSlots[0] ?? ""}
        selectedIndices={selectedSlots}
        recentlySelected={recentItems}
      />
    </>
  );
};
