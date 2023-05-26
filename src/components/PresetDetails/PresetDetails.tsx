import { InputLabel, TextField } from '@mui/material';
import React, { useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import './PresetDetails.css';

import { selectPreset, setPresetNotes, setPresetName } from '../../redux/store/reducers/preset-reducer';
import { NotesField } from '../NotesField/NotesField';

export const PresetDetails = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const {
    presetName,
    presetNotes
  } = useAppSelector(selectPreset);

  const [name, setName] = useState<string>(presetName);

  const onNotesBlur = useCallback(
    (formattedNotes: string) => {
      dispatch(setPresetNotes(formattedNotes));
    },
    [presetNotes]
  );

  const onNameChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setName(event.currentTarget.value);
    },
    [name]
  );

  const onNameBlur = useCallback(
    () => {
      dispatch(setPresetName(name));
    },
    [name]
  );

  const placeholder = presetName.length > 0 ? presetName : 'Add a name...';
  const value = name.length > 0 ? name : presetName;
  return (
    <>
      <fieldset className="preset-details">
        <legend>Details</legend>
        <InputLabel className="preset-details__label">
          Name
        </InputLabel>
        <TextField
          className="preset-details__name"
          placeholder={placeholder}
          value={value}
          fullWidth
          onChange={onNameChange}
          onBlur={onNameBlur}
        />
        <InputLabel className="preset-details__label">
          Notes
        </InputLabel>
        <NotesField
          placeholder="Add notes..."
          className="preset-details__notes"
          initialValue={presetNotes}
          onBlur={onNotesBlur}
        />
      </fieldset>
    </>
  );
};
