import React, { useCallback, useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import {
  InfoOutlined as InfoOutlinedIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  selectPreset,
  setPresetNotes,
  setPresetName
} from '../../redux/store/reducers/preset-reducer';
import './PresetDetails.css';

export const PresetDetails = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const { presetName, presetNotes } = useAppSelector(selectPreset);
  const [name, setName] = useState<string>(presetName);
  const [notes, setNotes] = useState<string>(presetNotes);

  const onNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setName(event.target.value);
    },
    []
  );

  const onNameBlur = useCallback(() => {
    dispatch(setPresetName(name));
  }, [dispatch, name]);

  const onNotesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNotes(event.target.value);
    },
    []
  );

  const onNotesBlur = useCallback(() => {
    dispatch(setPresetNotes(notes));
  }, [dispatch, notes]);

  return (
    <Card className="preset-details" elevation={0}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <InfoOutlinedIcon fontSize="small" color="action" />
          <Typography
            component="h2"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'text.secondary',
            }}
          >
            Preset Info
          </Typography>
        </Stack>

        <Stack spacing={4}>
          <TextField
            label="Name"
            placeholder="Give your preset a name..."
            value={name}
            fullWidth
            variant="outlined"
            onChange={onNameChange}
            onBlur={onNameBlur}
            size="medium"
          />

          <TextField
            label="Notes"
            placeholder="Add any general preset notes here..."
            value={notes}
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            onChange={onNotesChange}
            onBlur={onNotesBlur}
            size="medium"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};
