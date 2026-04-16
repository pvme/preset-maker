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
}

export const PresetExtras = ({
  title,
  slotType,
  items,
  maxItems,
  setItem,
  indexed = false,
  showNames = false,
}: PresetExtrasProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const maps = useEmojiMap();
  const isMobileScreen = useMediaQuery("(max-width:900px)");
  const { isPresetEditable } = useStorageMode();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectionIndex, setSelectionIndex] = useState(-1);

  const visibleItems = Array.from(
    { length: maxItems },
    (_, i) => items[i] ?? { id: "" },
  );

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
    (ids: string[]) => {
      const id = ids[0] ?? "";
      const value = id ? { id } : null;

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


  return (
    <div
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
        {visibleItems.map((item, index) => {
          const entry = item.id ? safeGet(item.id) : undefined;

          if (!entry) {
            return (
              <div
                key={index}
                className="preset-extras__item preset-extras__item--empty"
                onClick={isPresetEditable ? () => openDialog(index) : undefined}
              >
                {isPresetEditable && (
                  <AddIcon
                    className="preset-extras__add"
                    htmlColor="#646464"
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
                onClick={isPresetEditable ? () => openDialog(index) : undefined}
              >
                <span className="preset-extras__tooltip-anchor">
                  <img
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
