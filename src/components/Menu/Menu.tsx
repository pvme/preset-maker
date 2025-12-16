// src/components/Menu.tsx

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

import {
  Paper,
  Grid,
  Stack,
  Button,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Chip,
  CircularProgress,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

import {
  Save as SaveIcon,
  Add as AddIcon,
  ArrowDropDown,
  Warning as WarningIcon,
  Check as CheckIcon,
  Cloud as CloudIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Image as ImageIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
} from "@mui/icons-material";

import { RecentPresetDropdown } from "./RecentPresetDropdown";
import { SavePresetDialog, SavePresetDialogState } from "../SavePresetDialog/SavePresetDialog";

import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";

import { useStorageMode } from "../../storage/StorageModeContext";
import { CloudPresetStorage } from "../../storage/CloudPresetStorage";
import { addRecentPreset } from "../../storage/recent-presets";

import { usePresetDirtyState } from "./usePresetDirtyState";
import { usePresetSave } from "./usePresetSave";
import { usePresetLoader } from "./usePresetLoader";
import { useRecentPresets } from "./useRecentPresets";

import { usePresetExport } from "../../hooks/usePresetExport";
import { usePresetJsonExport } from "./usePresetJsonExport";
import { usePresetJsonImport } from "./usePresetJsonImport";

import { FunctionURLs } from "../../api/function-urls";

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
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id?: string }>();

  const preset = useAppSelector(selectPreset);
  const { presetName } = preset;

  const { mode, setMode } = useStorageMode();

  const { recentList, refresh, setRecentList } = useRecentPresets();
  const { isDirty, markClean } = usePresetDirtyState(preset);

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
  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);

  const canSaveCloud = mode !== "cloud";

  const { copyImage, downloadImage, clipboardSupported } =
    usePresetExport(presetName);

  const { exportJson } = usePresetJsonExport(preset);

  const { importJson } = usePresetJsonImport({
    markClean,
    setRecentSelection,
    setMode,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { loadRecent } = usePresetLoader({
    id,
    markClean,
    setRecentSelection,
  });

  /* ---------------------------------------------
     Save disabled reason
  --------------------------------------------- */

  const saveDisabledReason = (() => {
    if (isSaving) return "Saving in progress";
    if (!isDirty) return "No outstanding changes to save";
    if (mode === "cloud" && !canSaveCloud)
      return "You must be logged in to update cloud presets";
    return null;
  })();

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
              onSelect={(p) => {
                if (!p.presetId) return;
                loadRecent(p);
              }}
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
              Menu
            </Button>

            <Menu
              anchorEl={anchorExport}
              open={Boolean(anchorExport)}
              onClose={() => setAnchorExport(null)}
              disableScrollLock
            >
              {mode === "local" && id && (
                <>
                  <MenuItem
                    onClick={async () => {
                      try {
                        const newId = await CloudPresetStorage.savePreset(preset as any);
                        addRecentPreset({
                          presetId: newId,
                          presetName,
                          source: "cloud",
                        });
                        localStorage.removeItem(`preset:${id}`);
                        setMode("cloud");
                        navigate(`/${newId}`);
                        enqueueSnackbar("Uploaded to cloud", { variant: "success" });
                      } catch (err: any) {
                        enqueueSnackbar(
                          err?.message
                            ? `Upload failed: ${err.message}`
                            : "Upload failed",
                          { variant: "error" }
                        );
                      }
                    }}
                  >
                    <ListItemIcon>
                      <CloudIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Upload to Cloud" />
                  </MenuItem>
                  <Divider />
                </>
              )}

              <MenuItem
                onClick={() => {
                  if (!id) return;
                  const url = `${FunctionURLs.presetEmbed}?id=${encodeURIComponent(id)}`;
                  navigator.clipboard.writeText(url);
                  enqueueSnackbar("Link copied", { variant: "success" });
                }}
              >
                <ListItemIcon>
                  <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Copy Embed Link" />
              </MenuItem>

              <Divider />

              <MenuItem
                disabled={!clipboardSupported}
                onClick={async () => {
                  await copyImage();
                  enqueueSnackbar("Image copied", { variant: "success" });
                }}
              >
                <ListItemIcon>
                  <ContentCopyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Copy Image" />
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  await downloadImage();
                  enqueueSnackbar("Image downloaded", { variant: "success" });
                }}
              >
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Download Image" />
              </MenuItem>

              <Divider />

              <MenuItem onClick={exportJson}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export JSON" />
              </MenuItem>

              <MenuItem onClick={() => fileInputRef.current?.click()}>
                <ListItemIcon>
                  <FileUploadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Import JSON" />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) importJson(file);
                  }}
                />
              </MenuItem>
            </Menu>

            <Tooltip
              title={saveDisabledReason ?? ""}
              disableHoverListener={!saveDisabledReason}
              arrow
            >
              <span>
                <Button
                  onClick={() => (id ? save() : setSaveAsOpen(true))}
                  disabled={!isDirty || isSaving || !canSaveCloud}
                  startIcon={isSaving ? undefined : <SaveIcon />}
                  variant="contained"
                  color="success"
                >
                  {isSaving ? <CircularProgress size={20} /> : "Save"}
                </Button>
              </span>
            </Tooltip>

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
