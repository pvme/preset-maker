import React, { useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import LinkIcon from '@mui/icons-material/Link';

import { Button, ButtonGroup } from '@mui/material';

import { usePresetExport } from '../../hooks/usePresetExport';
import ImageIcon from '@mui/icons-material/Image';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { uploadPreset } from '../../api/upload-preset';
import { useAppSelector } from '../../redux/hooks';
import { selectPreset } from '../../redux/store/reducers/preset-reducer';

import { SavePresetDialog, SavePresetDialogState } from '../SavePresetDialog/SavePresetDialog';
import './PresetActions.css';

export const PresetActions = (): JSX.Element => {
  // 1) grab "id" from the route, not presetId
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const preset = useAppSelector(selectPreset);
  const [saveAsOpen, setSaveAsOpen] = useState(false);

  // 2) Save in-place if we have an ID, otherwise open Save As
  const handleSave = useCallback(async () => {
    if (!id) {
      setSaveAsOpen(true);
      return;
    }
    try {
      await uploadPreset(preset, id);
      enqueueSnackbar('Preset saved!', { variant: 'success' });
    } catch (err: any) {
      console.error('Save error:', err);
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: 'error' });
    }
  }, [preset, id, enqueueSnackbar]);

  // 3) Just open the dialog
  const handleSaveAs = useCallback(() => {
    setSaveAsOpen(true);
  }, []);

  // 4) On Save-As submit: POST without id, then navigate to new ID
  const handleSaveAsSubmit = useCallback(
    async (newName: string) => {
      let newId: string | undefined;
      try {
        const payload = { ...preset, presetName: newName };
        newId = await uploadPreset(payload);
        enqueueSnackbar('Preset cloned!', { variant: 'success' });
      } catch (err: any) {
        console.error('Save As error:', err);
        enqueueSnackbar(`Save As failed: ${err.message}`, { variant: 'error' });
      } finally {
        setSaveAsOpen(false);
        if (newId) {
          navigate(`/${newId}`);
        }
      }
    },
    [preset, navigate, enqueueSnackbar]
  );

  // 5) Copy embed link—only if we already have an ID
  const handleCopyEmbedLink = useCallback(() => {
    if (!id) return;
    const host = import.meta.env.DEV
      ? `http://${import.meta.env.VITE_FIREBASE_EMULATOR_HOST}/${import.meta.env.VITE_FIREBASE_PROJECT_ID}/us-central1`
      : 'https://presetembed-3iiueetvuq-uc.a.run.app';
    const url = `${host}/presetEmbed?id=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url);
    enqueueSnackbar('Embed link copied!', { variant: 'success' });
  }, [id, enqueueSnackbar]);

  const {
    exportBreakdown,
    copyBreakdownToClipboard,
    clipboardSupported
  } = usePresetExport();

  return (
    <div className="preset-actions">
      {/* …other panels above… */}

      {/* Export panel, styled exactly like PresetDetails */}
      <fieldset className="preset-details preset-export">
        <legend>Export</legend>
        <ButtonGroup
          orientation="vertical"
          variant="outlined"
          fullWidth
          className="preset-export__group"
        >
          <Button startIcon={<SaveIcon />} onClick={handleSave}>
            Save
          </Button>
          <Button startIcon={<SaveAsIcon />} onClick={handleSaveAs}>
            Save As
          </Button>
          <Button
            startIcon={<LinkIcon />}
            onClick={handleCopyEmbedLink}
            disabled={!id}
          >
            Copy Embed Link
          </Button>
          <Button
            variant="outlined"
            onClick={copyBreakdownToClipboard}
            disabled={!clipboardSupported}
          >
            Copy image to clipboard
          </Button>
          <Button
            variant="outlined"
            onClick={exportBreakdown}
          >
            Download as image
          </Button>
        </ButtonGroup>

      </fieldset>

      <SavePresetDialog
        open={saveAsOpen}
        state={SavePresetDialogState.NewPreset}
        onSave={handleSaveAsSubmit}
        onClose={() => setSaveAsOpen(false)}
      />
    </div>
  );
};
