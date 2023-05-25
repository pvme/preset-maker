import React, { useCallback } from 'react';
import { TextField } from '@mui/material';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import './PresetDetails.css';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

import { selectPreset, setNotes } from '../../redux/store/reducers/preset-reducer';

export const PresetDetails = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const {
    presetName,
    notes
  } = useAppSelector(selectPreset);

  const onNotesChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      // TODO: Emojify it
      dispatch(setNotes(event.currentTarget.value));
    },
    [notes]
  );

  return (
    <>
      <fieldset className="preset-details">
        <legend>Details</legend>
        <TextField
          label="Name"
          value={presetName}
          disabled
          fullWidth
        />
        <div>
          <TextareaAutosize
            placeholder="Notes"
            className="preset-details__notes"
            minRows={2}
            maxRows={4}
            value={notes}
            onChange={onNotesChange}
            spellCheck={false}
          />
        </div>
      </fieldset>
    {/* TODO Add notes */}
    </>
  );
};
