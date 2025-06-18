import React, { useCallback, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Stack
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectPreset, setPresetNotes, setPresetName } from '../../redux/store/reducers/preset-reducer';
import { NotesField } from '../NotesField/NotesField';
import './PresetDetails.css';

export const PresetDetails = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { presetName, presetNotes } = useAppSelector(selectPreset);
  const [name, setName] = useState<string>(presetName);

  const onNotesBlur = useCallback(
    (formattedNotes: string) => {
      dispatch(setPresetNotes(formattedNotes));
    },
    [dispatch]
  );

  const onNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setName(event.target.value);
    },
    []
  );

  const onNameBlur = useCallback(() => {
    dispatch(setPresetName(name));
  }, [dispatch, name]);

  return (
    <Card className="preset-details" elevation={0}>
      <CardContent>
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom
          sx={{ mb: 3, fontWeight: 500 }}
        >
          Details
        </Typography>
        
        <Stack spacing={3}>
          <TextField
            label="Name"
            placeholder={presetName || 'Add a name...'}
            value={name || presetName}
            fullWidth
            variant="outlined"
            onChange={onNameChange}
            onBlur={onNameBlur}
            size="small"
          />
          
          <Box>
            <Typography 
              variant="body2" 
              component="label" 
              sx={{ mb: 1, display: 'block', fontWeight: 500 }}
            >
              Notes
            </Typography>
            <NotesField
              placeholder="Add notes..."
              className="preset-details__notes"
              initialValue={presetNotes}
              onBlur={onNotesBlur}
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};