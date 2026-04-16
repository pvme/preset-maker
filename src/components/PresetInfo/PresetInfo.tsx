import React from "react";
import { Card, CardContent } from "@mui/material";

import ContentEditable, {
  type ContentEditableEvent,
} from "react-contenteditable";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectPreset,
  setPresetNotes,
  setPresetName,
} from "../../redux/store/reducers/preset-reducer";

import { useEmojiEditableField } from "../../hooks/useEmojiEditableField";
import { useStorageMode } from "../../storage/StorageModeContext";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import "./PresetInfo.css";

const isEmptyValue = (value: string | undefined | null) => {
  if (!value) return true;

  const textOnly = value
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]*>/g, "")
    .trim();

  return textOnly === "";
};

const noopContentEditableChange = (_event: ContentEditableEvent) => {};
const noopFocus: React.FocusEventHandler<HTMLElement> = () => {};
const noopBlur: React.FocusEventHandler<HTMLElement> = () => {};

export const PresetInfo = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const preset = useAppSelector(selectPreset);
  const { isPresetEditable } = useStorageMode();

  const nameField = useEmojiEditableField({
    value: preset?.presetName ?? "",
    allowMultiline: false,
    onCommit: (raw) => dispatch(setPresetName(raw)),
  });

  const notesField = useEmojiEditableField({
    value: preset?.presetNotes ?? "",
    allowMultiline: true,
    onCommit: (raw) => dispatch(setPresetNotes(raw)),
  });

  return (
    <Card className="preset-info" elevation={0}>
      <CardContent className="preset-info__content">
        <div
          className={[
            "preset-info__title-wrap",
            !isPresetEditable ? "preset-info__title-wrap--readonly" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {isPresetEditable && (
            <div className="preset-info__title-icon">
              <EditOutlinedIcon fontSize="small" />
            </div>
          )}

          {isEmptyValue(nameField.html) && (
            <div className="preset-info__title-placeholder">
              Name this preset...
            </div>
          )}

          <ContentEditable
            innerRef={nameField.ref}
            html={nameField.html}
            className={[
              "preset-info__title-input",
              !isPresetEditable ? "preset-info__title-input--readonly" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onFocus={
              isPresetEditable
                ? (nameField.onFocus as React.FocusEventHandler<HTMLElement>)
                : noopFocus
            }
            onChange={
              isPresetEditable
                ? (nameField.onChange as (event: ContentEditableEvent) => void)
                : noopContentEditableChange
            }
            onBlur={
              isPresetEditable
                ? (nameField.onBlur as React.FocusEventHandler<HTMLElement>)
                : noopBlur
            }
            disabled={!isPresetEditable}
          />
        </div>

        <div className="preset-info__notes-wrap">
          <div
            className={[
              "preset-info__notes-label",
              !isPresetEditable ? "preset-info__notes-label--readonly" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={
              isPresetEditable
                ? () => notesField.ref.current?.focus()
                : undefined
            }
            onMouseDown={
              isPresetEditable ? (e) => e.preventDefault() : undefined
            }
            role={isPresetEditable ? "button" : undefined}
            tabIndex={isPresetEditable ? 0 : undefined}
            onKeyDown={
              isPresetEditable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      notesField.ref.current?.focus();
                    }
                  }
                : undefined
            }
          >
            Preset notes:
          </div>

          {isEmptyValue(notesField.html) && (
            <div className="preset-info__notes-placeholder">
              {isPresetEditable
                ? "Add overall notes for the preset here..."
                : "There are no overall notes for this preset."}
            </div>
          )}

          <ContentEditable
            innerRef={notesField.ref}
            html={notesField.html}
            className={[
              "preset-info__notes-input",
              !isPresetEditable ? "preset-info__notes-input--readonly" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onFocus={
              isPresetEditable
                ? (notesField.onFocus as React.FocusEventHandler<HTMLElement>)
                : noopFocus
            }
            onChange={
              isPresetEditable
                ? (notesField.onChange as (event: ContentEditableEvent) => void)
                : noopContentEditableChange
            }
            onBlur={
              isPresetEditable
                ? (notesField.onBlur as React.FocusEventHandler<HTMLElement>)
                : noopBlur
            }
            disabled={!isPresetEditable}
          />
        </div>
      </CardContent>
    </Card>
  );
};
