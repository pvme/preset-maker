import React, { useCallback, useRef, useState, useEffect } from 'react';
import { emojify } from '../../utility/emojify';
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
} from '@mui/material';
import ContentEditable, { type ContentEditableEvent } from 'react-contenteditable';
import sanitizeHtml from 'sanitize-html';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
  const [rawNotes, setRawNotes] = useState<string>(presetNotes);
  const [notesHtml, setNotesHtml] = useState<string>(emojify(presetNotes));
  const notesRef = useRef<HTMLDivElement>(null);

  const sanitizeAndEmojifyInput = (input: string): string => {
    const cleaned = sanitizeHtml(input, {
      allowedTags: ['img', 'a', 'b', 'i', 'u', 'em', 'strong', 'br', 'div', 'span'],
      allowedAttributes: {
        img: ['src', 'alt', 'class'],
        a: ['href', 'target'],
        '*': ['style']
      }
    });
    return emojify(cleaned);
  }

  const onNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newName = event.target.value;
      setName(newName);
      dispatch(setPresetName(newName)); // <-- add this line
    },
    [dispatch]
  );

  const onNameBlur = useCallback(() => {
    dispatch(setPresetNotes(rawNotes));
  }, [dispatch, rawNotes]);

  useEffect(() => {
    setName(presetName);
  }, [presetName]);

  useEffect(() => {
    setRawNotes(presetNotes);
    setNotesHtml(emojify(presetNotes));
  }, [presetNotes]);

  const onNotesChange = useCallback((event: ContentEditableEvent) => {
    const raw = event.currentTarget.innerHTML;
    setRawNotes(event.currentTarget.innerText); // for saving raw text
    setNotesHtml(sanitizeAndEmojifyInput(raw));
  }, []);
  
  const onNotesBlur = useCallback(() => {
    const raw = notesRef.current?.innerHTML ?? '';
    const cleaned = sanitizeHtml(raw, {
      allowedTags: ['img', 'a', 'b', 'i', 'u', 'em', 'strong', 'br', 'div', 'span'],
      allowedAttributes: {
        img: ['src', 'alt', 'class'],
        a: ['href', 'target'],
        '*': ['style']
      }
    });
    dispatch(setPresetNotes(cleaned));
    setNotesHtml(emojify(cleaned));
  }, [dispatch]);

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
            InputProps={{
              sx: { fontSize: '16px' }
            }}
            InputLabelProps={{
              sx: { fontSize: '16px' }
            }}
          />

          <div className="notes-field-wrapper" style={{ position: 'relative' }}>
            {notesHtml.trim() === '' && (
              <div
                className="notes-field__placeholder"
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  color: '#999',
                  padding: '12px',
                }}
              >
                Add any general preset notes here...
              </div>
            )}
            <ContentEditable
              innerRef={notesRef}
              className="notes-field"
              html={notesHtml}
              onBlur={onNotesBlur}
              onChange={onNotesChange}
            />
          </div>
        </Stack>
      </CardContent>
    </Card>
  );
};
