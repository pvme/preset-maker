import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { useSnackbar } from "notistack";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { Button, ButtonGroup, Link } from "@mui/material";
import { useCallback, useState } from 'react';
import { resetSlots, selectPreset } from '../../redux/store/reducers/preset-reducer';
import { copyImageToClipboard, exportAsImage } from '../../utility/export-to-png';
import { ResetConfirmationDialog } from '../ResetConfirmationDialog/ResetConfirmationDialog';
import "./PresetActions.css";
import { sanitizedData, stringifyData } from '../../utility/sanitizer';
import { uploadPreset } from '../../api/upload-preset';
import { SavePresetDialog, SavePresetDialogState } from '../SavePresetDialog/SavePresetDialog';
import { LocalStorage } from '../../store/local-storage';

export const PresetActions = ({
  presetExportRef
}: {
  presetExportRef: HTMLDivElement | null
}) => {
  const dispatch = useAppDispatch();
  const { closeSnackbar, enqueueSnackbar } = useSnackbar();
  const {
    equipmentSlots,
    inventorySlots,
    presetName,
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

  const onSaveAsPngClick = useCallback(async () => {
    await exportAsImage(
      presetExportRef,
      `PRESET_${presetName.replaceAll(" ", "_")}`
    );
  }, [presetName]);

  const onSaveClick = useCallback(() => {
    LocalStorage.savePresetWithoutConfirmation({
      presetName,
      inventorySlots,
      equipmentSlots,
    });
    enqueueSnackbar("Preset saved", { variant: "success" });
  }, [presetName, inventorySlots, equipmentSlots]);

  const onSaveAsClick = useCallback(async () => {
    setSaveDialogOpen(true);
  }, [presetName]);

  const closeSaveDialog = useCallback(() => {
    setSaveDialogOpen(false);
  }, []);

  const onCopyImageToClipboardClick = useCallback(async () => {
    await copyImageToClipboard(presetExportRef, {
      onSuccess: () => {
        enqueueSnackbar("Copied image to clipboard", {
          variant: "success",
        });
      },
      onError: () => {
        enqueueSnackbar("Failed to copy image to clipboard", {
          variant: "error",
        });
      }
    });
  }, [presetExportRef]);

  const generateShareableLink = async () => {
    try {
      const sanitized = sanitizedData(inventorySlots, equipmentSlots);
      const stringified = stringifyData(
        presetName,
        sanitized.inventory,
        sanitized.equipment
      );

      setIsGeneratingLink(true);
      const generatingLinkSnackbarKey = enqueueSnackbar("Generating shareable link...", { variant: "info" });
      const id = await uploadPreset(stringified);

      const link = `https://pvme.github.io/preset-maker/#/${id}`;
      setGeneratedLink(link);

      await navigator.clipboard.writeText(link);
      closeSnackbar(generatingLinkSnackbarKey);
      enqueueSnackbar(
        `${link} has been copied to your clipboard!`,
        { variant: "success" }
      );
    } catch (err) {
      enqueueSnackbar("Something went wrong, please try again.", {
        variant: "error",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <div className="preset-actions">
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
            onClick={onSaveAsClick}
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
            onClick={generateShareableLink}
          >
            Create Shareable Link
          </Button>
          {generatedLink &&
            <Link className="preset-actions__link" href={generatedLink} underline="always">
              Link to preset
            </Link>
          }
          <Button
            className="preset-actions__button"
            variant="outlined"
            startIcon={<ContentCopyIcon/>}
            onClick={onCopyImageToClipboardClick}
          >
            Copy Image to Clipboard
          </Button>
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
  );
};
