// src/components/PresetActions/PresetActions.tsx

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
import { PresetSummary } from '../../schemas/preset-summary';
import './PresetActions.css';

const LOCAL_STORAGE_KEY = 'recentPresets';

function updateRecentPresetsDropdownLabel(newLabel: string) {
  const select = document.querySelector('.MuiSelect-select span');
  if (select) select.textContent = newLabel;
}

function saveToRecentPresets(summary: PresetSummary) {
  const prev = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as PresetSummary[];
  const updated = [summary, ...prev.filter(p => p.presetId !== summary.presetId)].slice(0, 20);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  updateRecentPresetsDropdownLabel(summary.presetName);
}

export const PresetActions = (): JSX.Element => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const preset = useAppSelector(selectPreset);
  const [saveAsOpen, setSaveAsOpen] = useState(false);

  const handleSave = useCallback(async () => {
    if (!id) {
      setSaveAsOpen(true);
      return;
    }
    try {
      await uploadPreset(preset, id);
      saveToRecentPresets({ presetId: id, presetName: preset.presetName });
      enqueueSnackbar('Preset saved!', { variant: 'success' });
    } catch (err: any) {
      console.error('Save error:', err);
      enqueueSnackbar(`Save failed: ${err.message}`, { variant: 'error' });
    }
  }, [preset, id, enqueueSnackbar]);

  const handleSaveAs = useCallback(() => {
    setSaveAsOpen(true);
  }, []);

  const handleSaveAsSubmit = useCallback(
    async (newName: string) => {
      try {
        const payload = { ...preset, presetName: newName };
        const { id: newId } = await uploadPreset(payload);
        saveToRecentPresets({ presetId: newId, presetName: newName });
        enqueueSnackbar('Preset cloned!', { variant: 'success' });
        navigate(`/${newId}`);
      } catch (err: any) {
        console.error('Save As error:', err);
        enqueueSnackbar(`Save As failed: ${err.message}`, { variant: 'error' });
      } finally {
        setSaveAsOpen(false);
      }
    },
    [preset, navigate, enqueueSnackbar]
  );

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
      <fieldset className="preset-details preset-export">
        <legend>Export</legend>
        <ButtonGroup
          orientation="vertical"
          variant="outlined"
          fullWidth
          className="preset-export__group"
        >
          <Button startIcon={<SaveIcon />} onClick={handleSave}>
            Save to Cloud
          </Button>
          <Button startIcon={<SaveAsIcon />} onClick={handleSaveAs}>
            Save As New Copy
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
            startIcon={<ContentCopyIcon />}
          >
            Copy as Image
          </Button>
          <Button
            variant="outlined"
            onClick={exportBreakdown}
            startIcon={<ImageIcon />}
          >
            Download as Image
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
