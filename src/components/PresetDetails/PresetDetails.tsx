import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
} from "@mui/material";

import ContentEditable from "react-contenteditable";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  selectPreset,
  setPresetNotes,
  setPresetName,
} from "../../redux/store/reducers/preset-reducer";

import { useEmojiEditableField } from "../../hooks/useEmojiEditableField";
import "./PresetDetails.css";

export const PresetDetails = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const preset = useAppSelector(selectPreset);

  const presetName = preset?.presetName ?? "";
  const presetNotes = preset?.presetNotes ?? "";

  const nameField = useEmojiEditableField({
    value: presetName,
    allowMultiline: false,
    onCommit: (raw) => dispatch(setPresetName(raw)),
  });

  const notesField = useEmojiEditableField({
    value: presetNotes,
    allowMultiline: true,
    onCommit: (raw) => dispatch(setPresetNotes(raw)),
  });

  return (
    <Card className="preset-details" elevation={0}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          className="preset-details__header"
        >
          <InfoOutlinedIcon fontSize="small" color="action" />
          <Typography component="h2" className="preset-details__title">
            Preset Info
          </Typography>
        </Stack>

        <Stack spacing={4}>
          {/* NAME */}
          <div className="field-wrapper name-field-wrapper">
            {nameField.raw.trim() === "" && (
              <div className="field-placeholder name-field-placeholder">
                Give your preset a name...
              </div>
            )}

            <ContentEditable
              innerRef={nameField.ref}
              className="field-editable name-field"
              html={nameField.html}
              onChange={nameField.onChange}
              onBlur={nameField.onBlur}
            />
          </div>

          {/* NOTES */}
          <div className="field-wrapper notes-field-wrapper">
            {notesField.raw.trim() === "" && (
              <div className="field-placeholder notes-field-placeholder">
                Add any general preset notes here...
              </div>
            )}

            <ContentEditable
              innerRef={notesField.ref}
              className="field-editable notes-field"
              html={notesField.html}
              onChange={notesField.onChange}
              onBlur={notesField.onBlur}
            />
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
};
