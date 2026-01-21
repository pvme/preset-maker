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

/**
 * Equipment UI slot order (must match <Equipment /> render order)
 */
const EQUIPMENT_UI_ORDER = [
  0,  // helm
  1,  // cape
  2,  // necklace
  3,  // main-hand
  4,  // body
  5,  // off-hand
  6,  // legs
  7,  // gloves
  8,  // boots
  9,  // ring
  10, // ammo
  11, // aura
  12, // pocket
];

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
  const [multiFill, setMultiFill] = useState(false);

  //
  // SHIFT-CLICK — toggles selection only (inventory only)
  //
  const handleSlotSelection = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      slotGroup: string,
    ) => {
      const key = `${slotGroup}:${index}`;

      // Equipment slots can never be multi-selected
      if (slotGroup !== "inventory") {
        dispatch(clearSelectedSlots());
        dispatch(toggleSlotSelection(key));
        dispatch(updateSlotKey(key));
        dispatch(updateSlotIndex(index));
        dispatch(updateSlotType(SlotType.Equipment));
        return;
      }

      const hasNonInventory = selectedSlots.some(
        (k) => !k.startsWith("inventory"),
      );
      if (hasNonInventory) {
        dispatch(clearSelectedSlots());
      }

      dispatch(updateSlotType(SlotType.Inventory));
      dispatch(toggleSlotSelection(key));
      dispatch(updateSlotKey(key));
      dispatch(updateSlotIndex(index));
    },
    [dispatch, selectedSlots],
  );

  //
  // SLOT CLICK — Opens dialog
  //
  const handleSlotOpen = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      slotGroup: string,
    ) => {
      const key = `${slotGroup}:${index}`;

      dispatch(
        updateSlotType(
          slotGroup === "inventory"
            ? SlotType.Inventory
            : SlotType.Equipment,
        ),
      );

      dispatch(clearSelectedSlots());
      dispatch(toggleSlotSelection(key));
      dispatch(updateSlotKey(key));
      dispatch(updateSlotIndex(index));
      setDialogOpen(true);
    },
    [dispatch],
  );

  //
  // NEXT SLOT (multi-fill helper)
  //
  const getNextSlotKey = useCallback(
    (currentKey: string) => {
      const [group, raw] = currentKey.split(":");
      const index = Number(raw);

      // Inventory → sequential
      if (group === "inventory") {
        const next = index + 1;
        if (next < inventorySlots.length) {
          return `inventory:${next}`;
        }
        return null;
      }

      // Equipment → UI order
      if (group === "equipment") {
        const pos = EQUIPMENT_UI_ORDER.indexOf(index);
        if (pos === -1) return null;

        const nextIndex = EQUIPMENT_UI_ORDER[pos + 1];
        if (nextIndex !== undefined) {
          return `equipment:${nextIndex}`;
        }
      }

      return null;
    },
    [inventorySlots.length],
  );

  //
  // DRAG & DROP — inventory ↔ equipment
  //
  const handleDragAndDrop = useCallback(
    (
      dragItem: { fromGroup: string; index: number; id: string },
      targetGroup: string,
      targetIndex: number,
    ) => {
      if (!dragItem.id) return;

      const entry = maps?.get(dragItem.id);
      const presetSlot = entry?.preset_slot ?? -1;

      if (dragItem.fromGroup === "inventory" && targetGroup === "equipment") {
        if (presetSlot !== targetIndex) return;

        dispatch(
          setEquipmentSlot({ index: targetIndex, value: { id: dragItem.id } }),
        );
        dispatch(
          setInventorySlot({ index: dragItem.index, value: { id: "" } }),
        );
        return;
      }

      if (dragItem.fromGroup === "equipment" && targetGroup === "inventory") {
        dispatch(
          setInventorySlot({ index: targetIndex, value: { id: dragItem.id } }),
        );
        dispatch(
          setEquipmentSlot({ index: dragItem.index, value: { id: "" } }),
        );
        return;
      }

      if (dragItem.fromGroup === "equipment" && targetGroup === "equipment") {
        if (presetSlot !== targetIndex) return;

        dispatch(
          setEquipmentSlot({ index: targetIndex, value: { id: dragItem.id } }),
        );
        dispatch(
          setEquipmentSlot({ index: dragItem.index, value: { id: "" } }),
        );
        return;
      }

      if (dragItem.fromGroup === "inventory" && targetGroup === "inventory") {
        dispatch(
          swapInventorySlots({ sourceIndex: dragItem.index, targetIndex }),
        );
      }
    },
    [dispatch, maps],
  );

  //
  // CLOSE dialog
  //
  const onDialogClose = useCallback(() => {
    setDialogOpen(false);
    dispatch(clearSelectedSlots());
  }, [dispatch]);

  //
  // APPLY chosen emoji/item
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

      if (!multiFill) {
        dispatch(clearSelectedSlots());
        return;
      }

      const nextKey = getNextSlotKey(indices[0]);
      if (!nextKey) {
        dispatch(clearSelectedSlots());
        return;
      }

      const [, raw] = nextKey.split(":");
      dispatch(clearSelectedSlots());
      dispatch(toggleSlotSelection(nextKey));
      dispatch(updateSlotKey(nextKey));
      dispatch(updateSlotIndex(Number(raw)));
    },
    [dispatch, multiFill, getNextSlotKey],
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
                <Inventory
                  slots={inventorySlots}
                  handleClickOpen={handleSlotOpen}
                  handleShiftClick={handleSlotSelection}
                  handleDragAndDrop={handleDragAndDrop}
                />

                <Equipment
                  slots={equipmentSlots}
                  handleClickOpen={handleSlotOpen}
                  handleShiftClick={handleSlotSelection}
                  handleDragAndDrop={handleDragAndDrop}
                />

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

      <EmojiSelectDialog
        open={dialogOpen}
        onClose={onDialogClose}
        onSelect={(ids) =>
          changeSlot(selectedSlots as string[], { id: ids[0] })
        }
        slotType={slotType}
        slotIndex={slotIndex}
        slotKey={selectedSlots[0] ?? ""}
        selectedIndices={selectedSlots}
        recentlySelected={recentItems}
        multiFill={multiFill}
        onToggleMultiFill={setMultiFill}
      />
    </>
  );
};
