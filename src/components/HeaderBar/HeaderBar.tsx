import { useSnackbar } from 'notistack';
import React, { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { validate } from 'typescript-json';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  importDataAction,
  selectPreset
} from '../../redux/store/reducers/preset-reducer';
import { type SavedPresetData } from '../../types/saved-preset-data';
import { exportAsJson } from '../../utility/export-to-json';
import { sanitizeAndStringifyPreset } from '../../utility/sanitizer';

import './HeaderBar.css';

export const HeaderBar = (): JSX.Element => {
  const inputFile = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { presetName, inventorySlots, equipmentSlots, relics, familiars } =
    useAppSelector(selectPreset);
  const { enqueueSnackbar } = useSnackbar();

  const exportData = useCallback(() => {
    const stringifiedPresetData = sanitizeAndStringifyPreset({
      presetName,
      equipmentSlots,
      inventorySlots,
      relics,
      familiars
    });
    exportAsJson(
      `PRESET_${presetName.replaceAll(' ', '_')}`,
      stringifiedPresetData
    );
  }, [presetName, inventorySlots, equipmentSlots]);

  const importData = useCallback(() => {
    inputFile.current?.click();
  }, []);

  const onFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files == null) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result === null || event.target?.result === undefined) {
          enqueueSnackbar(
            'Internal Server Error - Send your .json to nullopt#2057',
            { variant: 'error' }
          );
          return;
        }

        const data = JSON.parse(event.target.result as string);
        if (!validate<SavedPresetData>(data).success) {
          enqueueSnackbar('Invalid JSON data.', { variant: 'error' });
          return;
        }

        // import the json data into the preset editor
        dispatch(importDataAction(data));
        enqueueSnackbar('Successfully imported your preset.', {
          variant: 'success'
        });
      };

      reader.readAsText(event.target.files[0]);

      // Reset the file input so users can upload the same json
      event.target.value = '';
    },
    []
  );

  const onHomeClick = useCallback(() => {
    // go to root
    navigate('/');
    // refresh page to reset all data
    navigate(0);
  }, [navigate]);

  return (
    <Box className="header-bar">
      <input
        type="file"
        id="file"
        ref={inputFile}
        style={{ display: 'none' }}
        accept="application/JSON"
        onChange={onFileUpload}
      />
      <AppBar position="sticky">
        <Container className="app-bar">
          <Toolbar disableGutters className="tool-bar">
            <div className="image-container sub-item">
              <img
                width={80}
                height={80}
                src={'https://i.imgur.com/DhroQD5.gif'}
                onClick={onHomeClick}
              />
            </div>
            <Typography
              variant="h5"
              component="div"
              fontFamily="monospace"
              className="sub-item"
            >
              PVME Preset Generator
            </Typography>
            <ButtonGroup className="button-container sub-item">
              <Button color="inherit" variant="outlined" onClick={importData}>
                Import&nbsp;JSON
              </Button>
              <Button color="inherit" variant="outlined" onClick={exportData}>
                Export&nbsp;JSON
              </Button>
            </ButtonGroup>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
};
