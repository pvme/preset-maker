import { useSnackbar } from 'notistack';
import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validate } from 'typescript-json';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  importDataAction,
  selectPreset
} from '../../redux/store/reducers/preset-reducer';
import { type SavedPresetData } from '../../types/saved-preset-data';
import { exportAsJson } from '../../utility/export-to-json';
import { sanitizeAndStringifyPreset } from '../../utility/sanitizer';

import './HeaderBar.css';
import { HelpDialog } from '../HelpDialog/HelpDialog';
import { UserProfileButton } from '../auth/UserProfileButton/UserProfileButton';

export const HeaderBar = (): JSX.Element => {
  const inputFile = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();

  const dispatch = useAppDispatch();
  const { presetName, presetNotes, inventorySlots, equipmentSlots, relics, familiars } =
    useAppSelector(selectPreset);
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  const exportData = useCallback(() => {
    const stringifiedPresetData = sanitizeAndStringifyPreset({
      presetName,
      presetNotes,
      equipmentSlots,
      inventorySlots,
      relics,
      familiars
    });
    exportAsJson(
      `PRESET_${presetName.replaceAll(' ', '_')}`,
      stringifiedPresetData
    );
  }, [presetName, presetNotes, inventorySlots, equipmentSlots, relics, familiars]);

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
        const validationResult = validate<SavedPresetData>(data);
        if (!validationResult.success) {
          console.error(validationResult.errors);
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
    <>
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
          <Container className="header-bar__app-bar">
            <Toolbar disableGutters className="header-bar__tool-bar">
              <div className="header-bar__logo header-bar__item">
                <img
                  width={80}
                  height={80}
                  src={'https://img.pvme.io/images/EPzzJe2xy6.gif'}
                  onClick={onHomeClick}
                />
                <HelpOutlineIcon
                  className="header-bar__help-icon cursor-pointer"
                  onClick={() => { setHelpDialogOpen(true); }}
                />
              </div>
              <Typography
                variant="h5"
                component="div"
                fontFamily="monospace"
                className="header-bar__item"
              >
                PVME Preset Generator
              </Typography>
              <ButtonGroup className="header-bar__json header-bar__item desktop-only">
                <UserProfileButton />
                {/* <Button color="inherit" variant="outlined" onClick={importData}>
                  Import&nbsp;JSON
                </Button>
                <Button color="inherit" variant="outlined" onClick={exportData}>
                  Export&nbsp;JSON
                </Button> */}
              </ButtonGroup>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
      <HelpDialog
        open={helpDialogOpen}
        onClose={() => { setHelpDialogOpen(false); }}
      />
    </>
  );
};
