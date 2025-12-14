// src/components/SlotSection/SlotSection.tsx

import React, { useCallback } from "react";
import { DragPreviewImage, useDrag, useDrop } from "react-dnd";

import {
  equipmentCoords,
  equipmentCoordsMobile,
  inventoryCoords,
  inventoryCoordsMobile,
} from "../../data/coordinates";

import { type Coord } from "../../schemas/coord";
import { type Item as ItemData } from "../../schemas/item-data";
import { isMobile } from "../../utility/window-utils";

import { useEmojiMap } from "../../hooks/useEmojiMap";
import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";

import "./SlotSection.css";

interface SlotProps {
  slots: ItemData[];
  handleClickOpen: (e: any, index: number, slotGroup: string) => void;
  handleDragAndDrop?: (
    dragItem: { fromGroup: string; index: number; id: string },
    targetGroup: string,
    targetIndex: number
  ) => void;
  handleShiftClick?: (e: any, index: number, slotGroup: string) => void;
}

interface SlotSectionProps extends SlotProps {
  coords: Coord[];
  slotGroup: string;
}

interface SingleSlotProps extends SlotProps {
  index: number;
  coord: Coord;
  slotGroup: string;
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

  const maps = useEmojiMap();
  const { selectedSlots } = useAppSelector(selectPreset);

  const entry = slot.id && maps ? maps.get(slot.id) : undefined;
  const emojiUrl = entry && maps ? maps.getUrl(entry.id) ?? "" : "";

  const slotKey = `${slotGroup}:${index}`;
  const slotIsSelected = selectedSlots.includes(slotKey);

  const getClassName = () =>
    `${slotGroup}-icon-container ${
      slotIsSelected ? "selected" : ""
    }`;


  const onSlotSelect = useCallback(
    (e: React.MouseEvent<HTMLAreaElement>) => {
      if (e.shiftKey && handleShiftClick) {
        handleShiftClick(e, index, slotGroup);
      } else {
        handleClickOpen(e, index, slotGroup);
      }
    },
    [handleShiftClick, handleClickOpen, index, slotGroup]
  );

  //
  // DRAG SOURCE — unified type "SLOT_ITEM"
  //
  const [{ opacity }, dragRef, dragPreview] = useDrag(
    () => ({
      type: "SLOT_ITEM",
      item: {
        fromGroup: slotGroup,
        index,
        id: slot.id,
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 0.5 : 1,
      }),
    }),
    [slotGroup, index, slot.id]
  );

  //
  // DROP TARGET — accepts any SLOT_ITEM
  //
  const [, dropRef] = useDrop(
    () => ({
      accept: "SLOT_ITEM",
      drop: (dragItem: { fromGroup: string; index: number; id: string }) => {
        if (handleDragAndDrop) {
          handleDragAndDrop(dragItem, slotGroup, index);
        }
      },
    }),
    [handleDragAndDrop, slotGroup, index]
  );

  return (
    <>
      {emojiUrl && <DragPreviewImage connect={dragPreview} src={emojiUrl} />}

      <div ref={dropRef} style={{ position: "relative" }}>
        <div ref={dragRef}>
          <area
            shape="rect"
            coords={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            title={entry?.name ?? ""}
            style={{ cursor: "pointer", opacity, userSelect: "auto" }}
            onClick={onSlotSelect}
          />

          <div
            className={getClassName()}
            style={{
              position: "absolute",
              top: coord.y1,
              left: coord.x1,
              pointerEvents: "none",
            }}
          >
            {emojiUrl && (
              <img
                className={`${slotGroup}-icon`}
                src={emojiUrl}
                alt={entry?.name ?? ""}
              />
            )}
          </div>

        </div>
      </div>
    </>
  );
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
  const coords = isMobile() ? inventoryCoordsMobile : inventoryCoords;
  return <SlotSection {...props} coords={coords} slotGroup="inventory" />;
};

export const Equipment = (props: SlotProps) => {
  const coords = isMobile() ? equipmentCoordsMobile : equipmentCoords;
  return <SlotSection {...props} coords={coords} slotGroup="equipment" />;
};
