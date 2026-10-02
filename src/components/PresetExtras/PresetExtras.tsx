import React, { useCallback, useState } from "react";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Tooltip from "@mui/material/Tooltip";

import { useAppDispatch } from "../../redux/hooks";
import { EmojiSelectDialog } from "../EmojiSelectDialog/EmojiSelectDialog";
import { useEmojiMap } from "../../hooks/useEmojiMap";
import useMediaQuery from "@mui/material/useMediaQuery";
import { type AnyAction } from "@reduxjs/toolkit";
import { SlotType } from "../../schemas/slot-type";
import { type Item } from "../../schemas/item-data";
import { useStorageMode } from "../../storage/StorageModeContext";

import { tooltipSlotProps } from "../Tooltip/tooltipStyles";
import "./PresetExtras.css";
import { PresetIcon } from "../PresetEditor/PresetIcon";

interface PresetExtrasProps {
  title: string;
  slotType: SlotType;
  items: Item[];
  maxItems: number;
  setItem:
    | ((value: Item | null) => AnyAction)
    | ((payload: { index: number; value: Item | null }) => AnyAction);
  indexed?: boolean;
  showNames?: boolean;
  side?: string;
}

export const PresetExtras = ({
  title,
  slotType,
  items,
  maxItems,
  setItem,
  indexed = false,
  showNames = false,
  side,
}: PresetExtrasProps): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const maps = useEmojiMap();
  const isMobileScreen = useMediaQuery("(max-width:900px)");
  const { isPresetEditable } = useStorageMode();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectionIndex, setSelectionIndex] = useState(-1);

  const visibleItems = Array.from(
    { length: maxItems },
    (_, index) => ({ item: items[index] ?? { id: "" }, index }),
  ).filter(({ item }) => isPresetEditable || Boolean(item.id && maps?.getUrl(item.id)));

  const hasVisibleItems = visibleItems.length > 0;


  const openDialog = useCallback(
    (index: number) => {
      if (!isPresetEditable || isMobileScreen) return;
      setSelectionIndex(index);
      setDialogOpen(true);
    },
    [isPresetEditable, isMobileScreen],
  );

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectionIndex(-1);
  }, []);

  const onSelect = useCallback(
    (items: Item[]) => {
      const item = items[0] ?? { id: "" };
      const value = item.id ? item : null;

      if (indexed) {
        dispatch(
          (
            setItem as (payload: {
              index: number;
              value: Item | null;
            }) => AnyAction
          )({ index: selectionIndex, value }),
        );
      } else {
        dispatch((setItem as (value: Item | null) => AnyAction)(value));
      }

      closeDialog();
    },
    [dispatch, selectionIndex, setItem, indexed, closeDialog],
  );

  const safeGet = (id: string) => maps?.get(id);
  const safeUrl = (id: string) => maps?.getUrl(id) ?? "";


  if (!hasVisibleItems) return null;

  return (
    <div
      data-support-side={side}
      className={[
        "preset-extras",
        `preset-extras--slots-${maxItems}`,
        showNames ? "preset-extras--show-names" : "preset-extras--icons-only",
        isPresetEditable ? "preset-extras--editable" : "preset-extras--readonly",
      ].join(" ")}
    >
      <Typography className="preset-extras__title" variant="subtitle1">
        {title}
      </Typography>

      <div className="preset-extras__items">
        {visibleItems.map(({ item, index }) => {
          const entry = item.id ? safeGet(item.id) : undefined;

          if (!entry) {
            return (
              <div
                key={index}
                className="preset-extras__item preset-extras__item--empty"
                role={isPresetEditable ? "button" : undefined}
                tabIndex={isPresetEditable ? 0 : undefined}
                aria-label={isPresetEditable ? `Change ${title} slot ${index + 1}` : undefined}
                onKeyDown={isPresetEditable ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDialog(index); } } : undefined}
                onClick={isPresetEditable ? () => openDialog(index) : undefined}
              >
                {isPresetEditable && (
                  <AddIcon
                    className="preset-extras__add"
                    htmlColor="#b89b58"
                  />
                )}
              </div>
            );
          }

          const url = safeUrl(entry.id);

          return (
            <Tooltip
              key={index}
              title={entry.name}
              placement="top"
              disableInteractive
              arrow
              leaveDelay={0}
              slotProps={tooltipSlotProps}
            >
              <div
                className="preset-extras__item"
                role={isPresetEditable ? "button" : undefined}
                tabIndex={isPresetEditable ? 0 : undefined}
                aria-label={isPresetEditable ? `Change ${title} slot ${index + 1}` : undefined}
                onKeyDown={isPresetEditable ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDialog(index); } } : undefined}
                onClick={isPresetEditable ? () => openDialog(index) : undefined}
              >
                <span className="preset-extras__tooltip-anchor">
                  <PresetIcon
                    className="preset-extras__item-image"
                    src={url}
                    alt={entry.name}
                  />
                </span>

                {showNames && (
                  <span className="preset-extras__item-name">{entry.name}</span>
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>

      <EmojiSelectDialog
        open={isPresetEditable && dialogOpen}
        onClose={closeDialog}
        onSelect={onSelect}
        slotType={slotType}
        slotKey=""
        slotIndex={selectionIndex}
        selectedIndices={[`${selectionIndex}`]}
        recentlySelected={[]}
      />
    </div>
  );
};
