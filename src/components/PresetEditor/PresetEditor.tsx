// src/components/PresetEditor/PresetEditor.tsx

import React, { useCallback, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  toggleSlotSelection,
  clearSelectedSlots,
  selectPreset,
  moveSlot,
  setEquipmentSlot,
  setInventorySlot,
  swapInventorySlots,
  updateSlotIndex,
  updateSlotType,
  updateSlotKey,
  setFamiliar,
  setRelic,
  setAspect,
  setAmmoSpells,
} from "../../redux/store/reducers/preset-reducer";

import {
  addToQueue,
  selectRecentItems,
} from "../../redux/store/reducers/recent-item-reducer";

import { type Item as ItemData } from "../../schemas/item-data";
import { SlotType } from "../../schemas/slot-type";

import { EmojiSelectDialog } from "../EmojiSelectDialog/EmojiSelectDialog";

import { Equipment, Inventory } from "../SlotSection/SlotSection";
import { PresetExtras } from "../PresetExtras/PresetExtras";

import "./PresetEditor.css";
import borderSide from "../../assets/border-side.png";
import borderTop from "../../assets/border-top.png";
import cornerPath from "../../assets/corner.png";
import smallBackground from "../../assets/bg.png";
import genericBackground from "../../assets/bg_large.png";
import desktopPresetMapBackground from "../../assets/presetmap_desktop.png";
import mobilePresetMapBackground from "../../assets/presetmap_mobile.png";
import familiarIconPath from "../../assets/familiar.png";
import relicIconPath from "../../assets/relic.png";
import { useEmojiMap } from "../../hooks/useEmojiMap";

import { UI_TO_PRESET_SLOT } from "./equipmentSlots";

const EQUIPMENT_UI_ORDER = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export const PresetEditor = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const maps = useEmojiMap();
  const isCompactLayout = useMediaQuery("(max-width:900px)");

  const {
    inventorySlots,
    equipmentSlots,
    familiar,
    relics,
    aspect,
    AmmoSpells,
    slotType,
    selectedSlots,
    slotIndex,
  } = useAppSelector(selectPreset);

  const recentItems = useAppSelector(selectRecentItems);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [multiFill, setMultiFill] = useState(false);

  const panelFrame = (
    <div className="preset-layout__frame" aria-hidden="true">
      <span className="preset-layout__frame-corner preset-layout__frame-corner--tl" />
      <span className="preset-layout__frame-corner preset-layout__frame-corner--tr" />
      <span className="preset-layout__frame-corner preset-layout__frame-corner--bl" />
      <span className="preset-layout__frame-corner preset-layout__frame-corner--br" />

      <span className="preset-layout__frame-edge preset-layout__frame-edge--top" />
      <span className="preset-layout__frame-edge preset-layout__frame-edge--right" />
      <span className="preset-layout__frame-edge preset-layout__frame-edge--bottom" />
      <span className="preset-layout__frame-edge preset-layout__frame-edge--left" />
    </div>
  );

  const handleSlotSelection = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement>,
      index: number,
      slotGroup: string,
    ) => {
      const key = `${slotGroup}:${index}`;

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

  const handleSlotOpen = useCallback(
    (
      _event: React.MouseEvent<HTMLAreaElement | HTMLElement>,
      index: number,
      slotGroup: string,
    ) => {
      const key = `${slotGroup}:${index}`;

      dispatch(
        updateSlotType(
          slotGroup === "inventory" ? SlotType.Inventory : SlotType.Equipment,
        ),
      );

      const isAlreadySelected = selectedSlots.includes(key);
      const hasMultiSelection = selectedSlots.length > 1;

      if (isAlreadySelected && hasMultiSelection) {
        dispatch(updateSlotKey(key));
        dispatch(updateSlotIndex(index));
        setDialogOpen(true);
        return;
      }

      dispatch(clearSelectedSlots());
      dispatch(toggleSlotSelection(key));
      dispatch(updateSlotKey(key));
      dispatch(updateSlotIndex(index));
      setDialogOpen(true);
    },
    [dispatch, selectedSlots],
  );

  const getNextSlotKey = useCallback(
    (currentKey: string) => {
      const [group, raw] = currentKey.split(":");
      const index = Number(raw);

      if (group === "inventory") {
        const next = index + 1;
        if (next < inventorySlots.length) {
          return `inventory:${next}`;
        }
        return null;
      }

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

  const handleDragAndDrop = useCallback(
    (
      dragItem: { fromGroup: string; index: number; id: string },
      targetGroup: string,
      targetIndex: number,
    ) => {
      if (!dragItem.id) return;

      const entry = maps?.get(dragItem.id);
      const presetSlot = entry?.preset_slot ?? -1;
      const expectedPresetSlot =
        targetGroup === "equipment"
          ? (UI_TO_PRESET_SLOT[targetIndex] ?? -1)
          : -1;

      if (dragItem.fromGroup === "inventory" && targetGroup === "equipment") {
        if (presetSlot !== expectedPresetSlot) return;

        dispatch(
          moveSlot({
            fromType: dragItem.fromGroup,
            fromIndex: dragItem.index,
            toType: targetGroup,
            toIndex: targetIndex,
          }),
        );
        return;
      }

      if (dragItem.fromGroup === "equipment" && targetGroup === "inventory") {
        dispatch(
          moveSlot({
            fromType: dragItem.fromGroup,
            fromIndex: dragItem.index,
            toType: targetGroup,
            toIndex: targetIndex,
          }),
        );
        return;
      }

      if (dragItem.fromGroup === "equipment" && targetGroup === "equipment") {
        if (presetSlot !== expectedPresetSlot) return;

        dispatch(
          moveSlot({
            fromType: dragItem.fromGroup,
            fromIndex: dragItem.index,
            toType: targetGroup,
            toIndex: targetIndex,
          }),
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

  const onDialogClose = useCallback(() => {
    setDialogOpen(false);
    dispatch(clearSelectedSlots());
  }, [dispatch]);

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
        <CardContent data-id="content" className="preset-layout__content">
          <div
            className="preset-layout"
            style={{
              ["--preset-slot-bg" as string]: isCompactLayout
                ? "#2f2924"
                : `url(${smallBackground})`,
              ["--preset-extras-bg" as string]: `url(${genericBackground})`,
              ["--preset-frame-border-top" as string]: `url(${borderTop})`,
              ["--preset-frame-border-side" as string]: `url(${borderSide})`,
              ["--preset-frame-corner" as string]: `url(${cornerPath})`,
            }}
          >
            <div
              className="preset-layout__slots preset-layout__panel"
              style={{ backgroundImage: `url(${genericBackground})` }}
            >
              {panelFrame}

              <map name="presetmap" className="preset-slots">
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

                {isCompactLayout ? (
                  <div className="preset-slots__mobile-image">
                    <img
                      width={194}
                      height={487}
                      src={mobilePresetMapBackground}
                      useMap="#presetmap"
                      alt="preset mobile"
                    />
                  </div>
                ) : (
                  <img
                    width={472}
                    height={162}
                    src={desktopPresetMapBackground}
                    useMap="#presetmap"
                    alt="preset"
                  />
                )}
              </map>
            </div>

            <div className="preset-layout__extras preset-layout__panel">
              {panelFrame}

              <PresetExtras
                title="Relics"
                slotType={SlotType.Relic}
                items={relics}
                maxItems={3}
                setItem={setRelic}
                indexed
                showNames
              />
              <PresetExtras
                title="Familiar"
                slotType={SlotType.Familiar}
                items={[familiar]}
                maxItems={1}
                setItem={setFamiliar}
                showNames
              />
              <PresetExtras
                title="Aspect"
                slotType={SlotType.Aspect}
                items={[aspect]}
                maxItems={1}
                setItem={setAspect}
                showNames
              />
              <PresetExtras
                title="Ammo / Spells"
                slotType={SlotType.AmmoSpells}
                items={AmmoSpells}
                maxItems={3}
                setItem={setAmmoSpells}
                showNames
                indexed
              />
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
