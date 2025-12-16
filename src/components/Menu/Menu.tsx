import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Typography,
  CircularProgress,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  Save as SaveIcon,
  Add as AddIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Image as ImageIcon,
  ArrowDropDown,
  Warning as WarningIcon,
  Check as CheckIcon,
  FileUpload as FileUploadIcon,
  FileDownload as FileDownloadIcon,
  Cloud as CloudIcon,
} from "@mui/icons-material";

import { RecentPresetDropdown } from "./RecentPresetDropdown";
import { SavePresetDialog, SavePresetDialogState } from "../SavePresetDialog/SavePresetDialog";

import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { selectPreset, importDataAction } from "../../redux/store/reducers/preset-reducer";

import { blankPreset } from "../../schemas/preset";
import { validate } from "typescript-json";
import { type SavedPreset as SavedPresetData } from "../../schemas/saved-preset-data";

import { usePresetLoader } from "./usePresetLoader";

import { usePresetExport } from "../../hooks/usePresetExport";
import { usePresetJsonExport } from "./usePresetJsonExport";

import { addRecentPreset, removeRecentPreset } from "../../storage/recent-presets";
import { useStorageMode } from "../../storage/StorageModeContext";

import { getAuth, onAuthStateChanged } from "../../utility/firebase-init";
import { FunctionURLs } from "../../api/function-urls";

import { usePresetDirtyState } from "./usePresetDirtyState";
import { useRecentPresets } from "./useRecentPresets";
import { usePresetSave } from "./usePresetSave";

import "./Menu.css";

/* ---------------------------------------------
   Status Chip
--------------------------------------------- */

const StatusChip = ({ isDirty }: { isDirty: boolean | null }) => {
  if (isDirty === null) return null;
  return (
    <Chip
      icon={isDirty ? <WarningIcon /> : <CheckIcon />}
      label={isDirty ? "Unsaved Changes" : "Saved"}
      color={isDirty ? "warning" : "success"}
      variant="outlined"
      size="small"
    />
  );
};

/* ---------------------------------------------
   Component
--------------------------------------------- */

export const PresetMenu = (): JSX.Element => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id?: string }>();
  const { mode, setMode } = useStorageMode();

  const preset = useAppSelector(selectPreset);
  const { presetName } = preset;

  const { recentList, refresh, setRecentList } = useRecentPresets();
  const { isDirty, markClean, lastSavedRef } = usePresetDirtyState(preset);
  const { save, saveAs, isSaving } = usePresetSave({
    preset,
    presetName,
    mode,
    id,
    markClean,
    setRecentList,
  });

  const [recentSelection, setRecentSelection] = useState("");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [selectModeOpen, setSelectModeOpen] = useState(false);
  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const canSaveCloud = mode !== "cloud" || isLoggedIn;

  const { copyImage, downloadImage, clipboardSupported } =
    usePresetExport(presetName);

  const { exportJson } = usePresetJsonExport(preset);

  const { loadRecent } = usePresetLoader({
    id,
    markClean,
    setRecentSelection,
  });

  /* ---------------------------------------------
     Auth
  --------------------------------------------- */

  useEffect(
    () => onAuthStateChanged(getAuth(), (user) => setIsLoggedIn(!!user)),
    []
  );

  /* ---------------------------------------------
     Render
  --------------------------------------------- */

  return (
    <Paper className="preset-menu__paper">
      <Grid container justifyContent="space-between" sx={{ mt: 2, p: 2 }}>
        <Grid item>
          <Stack direction="row" spacing={3}>
            <Button startIcon={<AddIcon />} variant="contained">
              New Preset
            </Button>
            <RecentPresetDropdown
              selected={recentSelection}
              onSelect={loadRecent}
              items={recentList}
              onRemoved={refresh}
            />
          </Stack>
        </Grid>

        <Grid item>
          <Stack direction="row" spacing={3} alignItems="center">
            <Button
              onClick={(e) => setAnchorExport(e.currentTarget)}
              endIcon={<ArrowDropDown />}
            >
              Export
            </Button>

            <Menu
              anchorEl={anchorExport}
              open={Boolean(anchorExport)}
              onClose={() => setAnchorExport(null)}
              disableScrollLock
            >
              <MenuItem onClick={exportJson}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export JSON" />
              </MenuItem>
            </Menu>

            <Button
              onClick={() => (id ? save() : setSaveAsOpen(true))}
              disabled={!isDirty || isSaving || !canSaveCloud}
              startIcon={isSaving ? undefined : <SaveIcon />}
              variant="contained"
              color="success"
            >
              {isSaving ? <CircularProgress size={20} /> : "Save"}
            </Button>

            <StatusChip isDirty={isDirty} />
          </Stack>
        </Grid>
      </Grid>

      <SavePresetDialog
        open={saveAsOpen}
        state={SavePresetDialogState.NewPreset}
        defaultName={presetName}
        onSave={async (name) => {
          const newId = await saveAs(name);
          if (newId) navigate(`/${newId}`, { replace: true });
          setSaveAsOpen(false);
        }}
        onClose={() => setSaveAsOpen(false)}
      />
    </Paper>
  );
};

export default PresetMenu;
