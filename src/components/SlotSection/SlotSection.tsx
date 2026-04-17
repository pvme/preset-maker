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
  handleClickOpen: (
    e: React.MouseEvent<HTMLElement>,
    index: number,
    slotGroup: SlotGroup,
  ) => void;
  handleDragAndDrop?: (
    dragItem: { fromGroup: string; index: number; id: string },
    targetGroup: string,
    targetIndex: number,
  ) => void;
  handleShiftClick?: (
    e: React.MouseEvent<HTMLElement>,
    index: number,
    slotGroup: SlotGroup,
  ) => void;
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

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;

      if (isPresetEditable) {
        dragRef(node);
        dropRef(node);
      }
    },
    [dragRef, dropRef, isPresetEditable],
  );

  const slotStyle: React.CSSProperties = {
    position: "absolute",
    top: coord.y,
    left: coord.x,
    width: metrics.width,
    height: metrics.height,
    opacity,
    cursor: isPresetEditable ? "pointer" : "default",
    zIndex: 2,
    overflow: "visible",
  };

  const icon = entry ? (
    <img
      className={[
        "preset-slots__icon",
        slotGroup === "equipment" ? "preset-slots__icon--equipment" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      src={emojiUrl}
      alt={entry.name}
      style={{
        position: "relative",
        zIndex: 3,
        pointerEvents: "none",
      }}
    />
  ) : null;

  const slotNode = (
    <div
      ref={isPresetEditable ? setRefs : undefined}
      className={getClassName()}
      style={slotStyle}
      onClick={isPresetEditable ? onSlotSelect : undefined}
    >
      {icon}
    </div>
  );

  return (
    <>
      {isPresetEditable && emojiUrl && (
        <DragPreviewImage connect={dragPreview} src={emojiUrl} />
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
          {slotNode}
        </Tooltip>
      ) : (
        slotNode
      )}
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
  const isMobile = useMediaQuery("(max-width:900px)");
  const coords = isMobile ? inventoryCoordsMobile : inventoryCoords;

  return <SlotSection {...props} coords={coords} slotGroup="inventory" />;
};

export const Equipment = (props: SlotProps) => {
  const isMobile = useMediaQuery("(max-width:900px)");
  const coords = isMobile ? equipmentCoordsMobile : equipmentCoords;

  return <SlotSection {...props} coords={coords} slotGroup="equipment" />;
};
