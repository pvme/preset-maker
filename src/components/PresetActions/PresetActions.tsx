import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { Button, ButtonGroup, Link, TextField } from '@mui/material';
import { canCopyImagesToClipboard } from 'copy-image-clipboard';
import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { uploadPreset } from '../../api/upload-preset';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { resetSlots, selectPreset } from '../../redux/store/reducers/preset-reducer';
import { LocalStorage } from '../../store/local-storage';
import { copyImageToClipboard, getImageFromElement } from '../../utility/export-to-png';
import { sanitizeAndStringifyPreset } from '../../utility/sanitizer';
import { ResetConfirmationDialog } from '../ResetConfirmationDialog/ResetConfirmationDialog';
import { SavePresetDialog, SavePresetDialogState } from '../SavePresetDialog/SavePresetDialog';
import './PresetActions.css';
import { ClipboardCopyButtonContainer } from '../ClipboardCopyButtonContainer/ClipboardCopyButtonContainer';

const getLinkForPreset = (id: string): string => {
  if (document.location.hostname === 'localhost') {
    return `${document.location.origin}/#/${id}`;
  }

  return `https://pvme.github.io/preset-maker/#/${id}`;
};

export const PresetActions = ({
  presetExportRef
}: {
  presetExportRef: HTMLDivElement | null
}): JSX.Element => {
  const dispatch = useAppDispatch();
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const {
    equipmentSlots,
    familiars,
    inventorySlots,
    presetName,
    relics
  } = useAppSelector(selectPreset);

  const [resetConfirmationOpen, setResetConfirmationOpen] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);

  const onResetClick = useCallback(() => {
    setResetConfirmationOpen(true);
  }, []);

  const onResetConfirmation = useCallback(() => {
    dispatch(resetSlots());
    setResetConfirmationOpen(false);
  }, [dispatch]);

  const onResetConfirmationClose = useCallback(() => {
    setResetConfirmationOpen(false);
  }, []);

  const onSaveClick = useCallback(() => {
    LocalStorage.savePresetWithoutConfirmation({
      presetName,
      inventorySlots,
      equipmentSlots,
      relics,
      familiars
    });
    enqueueSnackbar('Preset saved', { variant: 'success' });
  }, [presetName, inventorySlots, equipmentSlots, relics, familiars]);

  const onSaveAsClick = useCallback(async () => {
    setSaveDialogOpen(true);
  }, [presetName]);

  const closeSaveDialog = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  const onCopyImageToClipboardClick = useCallback(async () => {
    await copyImageToClipboard(presetExportRef, {
      onSuccess: () => {
        enqueueSnackbar('Copied image to clipboard', {
          variant: 'success'
        });
      },
      onError: () => {
        enqueueSnackbar('Failed to copy image to clipboard', {
          variant: 'error'
        });
      }
    });
  }, [presetExportRef]);

  const generateShareableLink = async (): Promise<void> => {
    try {
      const presetImage = await getImageFromElement(presetExportRef);
      const stringifiedPresetData = sanitizeAndStringifyPreset({
        presetName,
        equipmentSlots,
        inventorySlots,
        relics,
        familiars,
        presetImage
      });

      setIsGeneratingLink(true);
      const generatingLinkSnackbarKey = enqueueSnackbar('Generating shareable link...', { variant: 'info' });
      const id = await uploadPreset(stringifiedPresetData);

      const link = getLinkForPreset(id);
      setGeneratedLink(link);

      await navigator.clipboard.writeText(link);
      closeSnackbar(generatingLinkSnackbarKey);
      enqueueSnackbar(
        `${link} has been copied to your clipboard!`,
        { variant: 'success' }
      );
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Something went wrong, please try again.', {
        variant: 'error'
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <div className="preset-actions">
      {/* Details */}
      <fieldset className="preset-actions__fieldset preset-actions__details">
        <legend>Details</legend>
        <TextField
          label="Name"
          value={presetName}
          disabled
          fullWidth
        />
      </fieldset>
      <div className="preset-actions desktop-only">
        {/* Save actions */}
        <fieldset className="preset-actions__fieldset preset-actions__save">
          <legend>Save</legend>
          <ButtonGroup className="preset-actions__button-group" orientation="vertical">
            <Button
              className="preset-actions__button"
              variant="contained"
              startIcon={<SaveIcon/>}
              onClick={onSaveClick}
            >
              Save
            </Button>
            <Button
              className="preset-actions__button"
              variant="outlined"
              startIcon={<SaveAsIcon/>}
              onClick={() => {
                void onSaveAsClick();
              }}
            >
              Save As
            </Button>
          </ButtonGroup>
        </fieldset>
        {/* Export actions */}
        <fieldset className="preset-actions__fieldset preset-actions__export">
          <legend>Export</legend>
          <ButtonGroup className="preset-actions__button-group" orientation="vertical">
            <Button
              className="preset-actions__button"
              variant="contained"
              startIcon={<LinkIcon/>}
              disabled={isGeneratingLink}
              onClick={() => {
                void generateShareableLink();
              }}
            >
              Create Shareable Link
            </Button>
            {(generatedLink != null && generatedLink.length > 0) &&
              <Link className="preset-actions__link" href={generatedLink} underline="always">
                Link to preset
              </Link>
            }
            <ClipboardCopyButtonContainer>
              <Button
                className="preset-actions__button"
                variant="outlined"
                startIcon={<ContentCopyIcon/>}
                disabled={!canCopyImagesToClipboard()}
                onClick={() => {
                  void onCopyImageToClipboardClick();
                }}
              >
                Copy Image to Clipboard
              </Button>
            </ClipboardCopyButtonContainer>
          </ButtonGroup>
        </fieldset>
        {/* Reset actions */}
        <div className="preset-actions__reset">
          <Button
            className="preset-actions__button width-100"
            color="error"
            variant="contained"
            size="small"
            onClick={onResetClick}
          >
            Reset
          </Button>
        </div>
        {/* Dialogs */}
        <ResetConfirmationDialog
          open={resetConfirmationOpen}
          handleConfirmation={onResetConfirmation}
          handleClose={onResetConfirmationClose}
        />
        <SavePresetDialog
          open={saveDialogOpen}
          state={SavePresetDialogState.ExistingPreset}
          onClose={closeSaveDialog}
        />
      </div>
    </div>
  );
};
