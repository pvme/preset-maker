import React, { useCallback } from "react";
import { DragPreviewImage, useDrag, useDrop } from "react-dnd";
import useMediaQuery from "@mui/material/useMediaQuery";
import Tooltip from "@mui/material/Tooltip";

import {
  SLOT_METRICS,
  equipmentCoords,
  equipmentCoordsMobile,
  inventoryCoords,
  inventoryCoordsMobile,
} from "../../data/coordinates";

import { type Coord } from "../../schemas/coord";
import { type Item as ItemData } from "../../schemas/item-data";

import { useEmojiMap } from "../../hooks/useEmojiMap";
import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";
import { useStorageMode } from "../../storage/StorageModeContext";

import { tooltipSlotProps } from "../Tooltip/tooltipStyles";
import "./SlotSection.css";

type SlotGroup = "inventory" | "equipment";

interface SlotProps {
  slots: ItemData[];
  handleClickOpen: (e: any, index: number, slotGroup: SlotGroup) => void;
  handleDragAndDrop?: (
    dragItem: { fromGroup: string; index: number; id: string },
    targetGroup: string,
    targetIndex: number,
  ) => void;
  handleShiftClick?: (e: any, index: number, slotGroup: SlotGroup) => void;
}

interface SlotSectionProps extends SlotProps {
  coords: Coord[];
  slotGroup: SlotGroup;
}

interface SingleSlotProps extends SlotProps {
  index: number;
  coord: Coord;
  slotGroup: SlotGroup;
}

const SingleSlot = ({
  index,
  coord,
  slotGroup,
  slots,
  handleClickOpen,
  handleShiftClick,
  handleDragAndDrop,
}: SingleSlotProps): JSX.Element | null => {
  const slot = slots[index];
  if (!slot) return null;

  const metrics = SLOT_METRICS[slotGroup];

  const maps = useEmojiMap();
  const { selectedSlots } = useAppSelector(selectPreset);
  const { isPresetEditable } = useStorageMode();

  const entry = slot.id && maps ? maps.get(slot.id) : undefined;
  const emojiUrl = entry && maps ? (maps.getUrl(entry.id) ?? "") : "";

  const slotKey = `${slotGroup}:${index}`;
  const slotIsSelected = isPresetEditable && selectedSlots.includes(slotKey);

  const getClassName = () =>
    [
      "preset-slots__slot",
      `preset-slots__slot--${slotGroup}`,
      emojiUrl ? "preset-slots__slot--filled" : "",
      slotIsSelected ? "preset-slots__slot--selected" : "",
      isPresetEditable ? "preset-slots__slot--editable" : "",
    ]
      .filter(Boolean)
      .join(" ");

  const onSlotSelect = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!isPresetEditable) return;

      if (e.shiftKey && handleShiftClick) {
        handleShiftClick(e, index, slotGroup);
      } else {
        handleClickOpen(e, index, slotGroup);
      }
    },
    [isPresetEditable, handleShiftClick, handleClickOpen, index, slotGroup],
  );

  const [{ opacity }, dragRef, dragPreview] = useDrag(
    () => ({
      type: "SLOT_ITEM",
      item: {
        fromGroup: slotGroup,
        index,
        id: slot.id,
      },
      canDrag: isPresetEditable,
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    [slotGroup, index, slot.id, isPresetEditable],
  );

  const [, dropRef] = useDrop(
    () => ({
      accept: "SLOT_ITEM",
      canDrop: () => isPresetEditable,
      drop: (dragItem: { fromGroup: string; index: number; id: string }) => {
        if (isPresetEditable && handleDragAndDrop) {
          handleDragAndDrop(dragItem, slotGroup, index);
        }
      },
    }),
    [handleDragAndDrop, slotGroup, index, isPresetEditable],
  );

  const content = (
    <>
      {isPresetEditable && emojiUrl && (
        <DragPreviewImage connect={dragPreview} src={emojiUrl} />
      )}

      <div
        ref={isPresetEditable ? dropRef : undefined}
        style={{ position: "relative" }}
      >
        <div ref={isPresetEditable ? dragRef : undefined}>
          {isPresetEditable && (
            <area
              shape="rect"
              coords={`${coord.x},${coord.y},${coord.x + metrics.slotBoxWidth},${coord.y + metrics.slotBoxHeight}`}
              title=""
              style={{
                cursor: "pointer",
                opacity,
                userSelect: "auto",
              }}
              onClick={onSlotSelect}
            />
          )}

          {entry ? (
            <Tooltip
              title={entry.name}
              placement="top"
              arrow
              disableInteractive
              slotProps={tooltipSlotProps}
              leaveDelay={0}
            >
              <div
                className={getClassName()}
                style={{
                  position: "absolute",
                  top: coord.y,
                  left: coord.x,
                  width: metrics.width,
                  height: metrics.height,
                  opacity,
                  cursor: isPresetEditable ? "pointer" : "default",
                }}
                onClick={isPresetEditable ? onSlotSelect : undefined}
              >
                <img
                  className={[
                    "preset-slots__icon",
                    slotGroup === "equipment"
                      ? "preset-slots__icon--equipment"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  src={emojiUrl}
                  alt={entry.name}
                />
              </div>
            </Tooltip>
          ) : (
            <div
              className={getClassName()}
              style={{
                position: "absolute",
                top: coord.y,
                left: coord.x,
                width: metrics.width,
                height: metrics.height,
                opacity,
                cursor: isPresetEditable ? "pointer" : "default",
              }}
              onClick={isPresetEditable ? onSlotSelect : undefined}
            />
          )}
        </div>
      </div>
    </>
  );

  return content;
};

const SlotSection = ({
  slots,
  coords,
  slotGroup,
  handleClickOpen,
  handleShiftClick,
  handleDragAndDrop,
}: SlotSectionProps): JSX.Element => {
  return (
    <>
      {coords.map((coord, index) => (
        <SingleSlot
          key={index}
          slots={slots}
          coord={coord}
          index={index}
          slotGroup={slotGroup}
          handleClickOpen={handleClickOpen}
          handleShiftClick={handleShiftClick}
          handleDragAndDrop={handleDragAndDrop}
        />
      ))}
    </>
  );
};

export const Inventory = (props: SlotProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const coords = isMobile ? inventoryCoordsMobile : inventoryCoords;

  return <SlotSection {...props} coords={coords} slotGroup="inventory" />;
};

export const Equipment = (props: SlotProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const coords = isMobile ? equipmentCoordsMobile : equipmentCoords;

  return <SlotSection {...props} coords={coords} slotGroup="equipment" />;
};
