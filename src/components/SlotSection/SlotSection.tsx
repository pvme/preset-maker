import React, { useCallback } from "react";
import { DragPreviewImage, useDrag, useDrop } from "react-dnd";
import useMediaQuery from "@mui/material/useMediaQuery";
import Tooltip from "@mui/material/Tooltip";
import sanitizeHtml from "sanitize-html";

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
import {
  getEmojiAmmoHoverNote,
  getEmojiDisplayName,
  prependAutomaticNote,
  removeAutomaticAmmoNote,
} from "../../emoji/displayName";
import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";
import { useStorageMode } from "../../storage/StorageModeContext";
import { emojify } from "../../utility/emojify";
import { tooltipSlotProps } from "../Tooltip/tooltipStyles";

import "./SlotSection.css";

type SlotGroup = "inventory" | "equipment";

const tooltipNoteAllowedTags = ["img", "br", "div", "span"];
const tooltipNoteAllowedAttributes = {
  img: ["src", "alt", "title", "class", "data-emoji"],
};

function normalizeStoredEmojiMarkup(note: string) {
  let normalized = note
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<img\b[^>]*\bdata-emoji=["']([^"']+)["'][^>]*>/gi, "$1");

  const orphanedEmojiAttributes =
    /\bclass=["']disc-emoji["'][\s\S]*?\bdata-emoji=["']([^"']+)["'][\s\S]*?(?:\/>|>)/i;

  let match = normalized.match(orphanedEmojiAttributes);
  while (match?.index !== undefined) {
    normalized =
      normalized.slice(0, match.index) +
      match[1] +
      normalized.slice(match.index + match[0].length);
    match = normalized.match(orphanedEmojiAttributes);
  }

  return normalized;
}

function renderTooltipNote(note: string) {
  const normalized = normalizeStoredEmojiMarkup(note);
  if (!normalized.trim()) return "";

  const html = sanitizeHtml(emojify(normalized).replace(/\r?\n/g, "<br />"), {
    allowedTags: tooltipNoteAllowedTags,
    allowedAttributes: tooltipNoteAllowedAttributes,
    allowedSchemes: ["https"],
  });

  const text = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/g, " ")
    .trim();

  return text || /<img\b/i.test(html) ? html : "";
}

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
  const preset = useAppSelector(selectPreset);
  const { selectedSlots } = preset;
  const { isPresetEditable } = useStorageMode();

  const entry = slot.id && maps ? maps.get(slot.id) : undefined;
  const emojiUrl = entry && maps ? (maps.getUrl(entry.id) ?? "") : "";
  const displayName = entry
    ? getEmojiDisplayName(entry, slot.eof_spec)
    : undefined;
  const tooltipName = displayName ?? entry?.name;
  const savedSlotNote =
    preset.breakdown.find(
      (breakdownEntry) =>
        breakdownEntry.slotType === slotGroup &&
        breakdownEntry.slotIndex === index,
    )?.description;
  const automaticNote = getEmojiAmmoHoverNote(entry);
  const storedNote = savedSlotNote || entry?.note;
  const customNote = removeAutomaticAmmoNote(automaticNote, storedNote);
  const slotNote = prependAutomaticNote(
    automaticNote,
    customNote,
  );
  const tooltipNoteHtml = slotNote ? renderTooltipNote(slotNote) : "";

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
      alt={displayName ?? entry.name}
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
          title={
            <div className="preset-slots__tooltip">
              <div className="preset-slots__tooltip-title">
                {tooltipName ?? entry.name}
              </div>
              {tooltipNoteHtml && (
                <div
                  className="preset-slots__tooltip-note"
                  dangerouslySetInnerHTML={{ __html: tooltipNoteHtml }}
                />
              )}
            </div>
          }
          placement="top"
          arrow
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
