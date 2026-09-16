// src/components/PresetMenu.tsx

import { lazy, Suspense, useRef, useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
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
  CircularProgress,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

import {
  Save as SaveIcon,
  Add as AddIcon,
  ArrowDropDown,
  Cloud as CloudIcon,
  Link as LinkIcon,
  ContentCopy as ContentCopyIcon,
  Image as ImageIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
} from "@mui/icons-material";

import { RecentPresetDropdown } from "./RecentPresetDropdown";
import { InventoryLayoutSelect } from "./InventoryLayoutSelect";
import { type InventoryLayout } from "../../hooks/useInventoryLayout";
import {
  SavePresetDialog,
  SavePresetDialogState,
  NewPresetMode,
} from "../SavePresetDialog/SavePresetDialog";

import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";

import { useAuth } from "../../auth/AuthContext";
import { useStorageMode } from "../../storage/StorageModeContext";
import { usePresetLoad } from "../../storage/PresetLoadContext";
import { CloudPresetStorage } from "../../storage/CloudPresetStorage";
import {
  addRecentPreset,
  removeRecentPreset,
} from "../../storage/recent-presets";

import { usePresetDirtyState } from "./usePresetDirtyState";
import { usePresetSave } from "./usePresetSave";
import { usePresetLoader } from "./usePresetLoader";
import { useRecentPresets } from "./useRecentPresets";

import { usePresetExport } from "../../hooks/usePresetExport";
import { usePresetJsonExport } from "./usePresetJsonExport";
import { usePresetJsonImport } from "./usePresetJsonImport";

import { FunctionURLs } from "../../api/function-urls";

import "./PresetMenu.css";

import { tooltipSlotProps } from "../Tooltip/tooltipStyles";

const ImportImageDialog = lazy(
  () => import("../ImportImageDialog/ImportImageDialog"),
);

/* ---------------------------------------------
   Component
--------------------------------------------- */

export const PresetMenu = ({
  layout,
  onLayoutChange,
}: {
  layout: InventoryLayout;
  onLayoutChange: (layout: InventoryLayout) => void;
}): JSX.Element => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id?: string }>();

  const preset = useAppSelector(selectPreset);
  const { presetName } = preset;

  const { mode, setMode, isPresetEditable } = useStorageMode();
  const { isPresetLoading } = usePresetLoad();
  const { isLoggedIn } = useAuth();

  const { recentList, refresh, setRecentList } = useRecentPresets();
  const { isDirty, markClean } = usePresetDirtyState(preset);

  const isMobile = useMediaQuery("(max-width:900px)");

  const { save, saveAs, saveFresh, isSaving } = usePresetSave({
    preset,
    presetName,
    mode,
    id,
    markClean,
    setRecentList,
  });

  const [recentSelection, setRecentSelection] = useState("");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [uploadConfirmOpen, setUploadConfirmOpen] = useState(false);
  const [anchorExport, setAnchorExport] = useState<null | HTMLElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageImportOpen, setImageImportOpen] = useState(false);

  const canShowPresetWriteActions = !isPresetLoading;
  const canSave = mode === "local" || (mode === "cloud" && isLoggedIn);

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
    refreshRecentPresets: refresh,
  });

  const saveDisabledReason = (() => {
    if (isSaving) return "Saving in progress";
    if (!isDirty) return "No outstanding changes to save";
    if (mode === "cloud" && !isLoggedIn)
      return "Only PvME Staff can currently update cloud presets";
    return null;
  })();

  const handleUploadToCloud = async () => {
    if (isUploading || !id) return;

    setUploadConfirmOpen(false);
    setAnchorExport(null);
    setIsUploading(true);

    try {
      const newId = await CloudPresetStorage.savePreset(preset as any);

      localStorage.removeItem(`preset:${id}`);
      removeRecentPreset(id);

      addRecentPreset({
        presetId: newId,
        presetName,
        source: "cloud",
      });

      setRecentSelection("");
      refresh();

      setMode("cloud");
      navigate(`/${newId}`);
      enqueueSnackbar("Uploaded to cloud", {
        variant: "success",
      });
    } catch (err: any) {
      enqueueSnackbar(
        err?.message ? `Upload failed: ${err.message}` : "Upload failed",
        { variant: "error" },
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Paper className="preset-menu__paper">
      <Grid
        container
        justifyContent="space-between"
        className="preset-menu"
        sx={{ mt: 2, p: 2 }}
      >
        <Grid item className="preset-menu__primary">
          <Stack
            direction="row"
            spacing={2}
            className="preset-menu__primary-actions"
          >
            {!isMobile && (
              <Button
                className="preset-menu__new-button"
                startIcon={<AddIcon />}
                variant="contained"
                onClick={() => setSaveAsOpen(true)}
              >
                New Preset
              </Button>
            )}

            <div className="preset-menu__recent">
              <RecentPresetDropdown
                selected={recentSelection}
                onSelect={(p) => {
                  if (!p.presetId) return;
                  loadRecent(p);
                }}
                items={recentList}
                onRemoved={refresh}
              />
            </div>
          </Stack>
        </Grid>

        <Grid item className="preset-menu__secondary">
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            className="preset-menu__secondary-actions"
          >
            <Button
              className="preset-menu__menu-button"
              onClick={(e) => setAnchorExport(e.currentTarget)}
              endIcon={<ArrowDropDown />}
            >
              Menu
            </Button>

            <Menu
              anchorEl={anchorExport}
              open={Boolean(anchorExport)}
              onClose={() => setAnchorExport(null)}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              disableScrollLock
            >
              <InventoryLayoutSelect layout={layout} onChange={onLayoutChange} />
              <Divider />
              {isMobile && (
                <>
                  <MenuItem
                    onClick={() => {
                      setAnchorExport(null);
                      setSaveAsOpen(true);
                    }}
                  >
                    <ListItemIcon>
                      <AddIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="New preset" />
                  </MenuItem>
                  <Divider />
                </>
              )}
              {canShowPresetWriteActions && mode === "local" && id && (
                <>
                  <MenuItem
                    disabled={isUploading}
                    onClick={() => {
                      if (isUploading) return;
                      setUploadConfirmOpen(true);
                    }}
                  >
                    <ListItemIcon>
                      {isUploading ? (
                        <CircularProgress size={18} />
                      ) : (
                        <CloudIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={isUploading ? "Uploading…" : "Upload to cloud"}
                    />
                  </MenuItem>
                  <Divider />
                </>
              )}

              <MenuItem
                onClick={() => {
                  if (!id) return;
                  const url = `${FunctionURLs.presetEmbed}?id=${encodeURIComponent(
                    id,
                  )}`;
                  navigator.clipboard.writeText(url);
                  enqueueSnackbar("Link copied", { variant: "success" });
                }}
              >
                <ListItemIcon>
                  <LinkIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Copy embed link" />
              </MenuItem>

              <Divider />

              <MenuItem
                disabled={!clipboardSupported}
                onClick={async () => {
                  try {
                    await copyImage();
                    enqueueSnackbar("Image copied", { variant: "success" });
                  } catch {
                    enqueueSnackbar("Could not copy the image. Check that item images have loaded and try again.", { variant: "error" });
                  }
                }}
              >
                <ListItemIcon>
                  <ContentCopyIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Copy image" />
              </MenuItem>

              <MenuItem
                onClick={async () => {
                  try {
                    await downloadImage();
                    enqueueSnackbar("Image downloaded", { variant: "success" });
                  } catch {
                    enqueueSnackbar("Could not download the image. Check that item images have loaded and try again.", { variant: "error" });
                  }
                }}
              >
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Download image" />
              </MenuItem>

              <Divider />

              <MenuItem onClick={exportJson}>
                <ListItemIcon>
                  <FileDownloadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Export backup" />
              </MenuItem>

              <MenuItem onClick={() => fileInputRef.current?.click()}>
                <ListItemIcon>
                  <FileUploadIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Import backup" />
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
              <Divider />
              <MenuItem
                disabled={isPresetLoading || !isPresetEditable}
                onClick={() => {
                  setAnchorExport(null);
                  setImageImportOpen(true);
                }}
              >
                <ListItemIcon>
                  <ImageIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Import screenshot" />
              </MenuItem>
            </Menu>

            {canShowPresetWriteActions && isPresetEditable && (
              <Tooltip
                title={saveDisabledReason ?? ""}
                disableHoverListener={!saveDisabledReason}
                arrow
                slotProps={tooltipSlotProps}
              >
                <span>
                  <Button
                    className="preset-menu__save-button"
                    onClick={() => (id ? save() : setSaveAsOpen(true))}
                    disabled={!isDirty || isSaving || !canSave}
                    startIcon={isSaving ? undefined : <SaveIcon />}
                    variant="contained"
                    color="success"
                  >
                    {isSaving ? <CircularProgress size={20} /> : "Save"}
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Grid>
      </Grid>

      <SavePresetDialog
        open={saveAsOpen}
        state={SavePresetDialogState.NewPreset}
        defaultName={presetName}
        onSave={async (name, mode: NewPresetMode) => {
          const newId =
            mode === "duplicate" ? await saveAs(name) : await saveFresh(name);

          if (newId) {
            setRecentSelection("");
            setMode("local");
            navigate(`/${newId}`, { replace: true });
            setSaveAsOpen(false);
          }
        }}
        onClose={() => setSaveAsOpen(false)}
      />

      {imageImportOpen && (
        <Suspense
          fallback={
            <Dialog open onClose={() => setImageImportOpen(false)}>
              <DialogTitle>Import Screenshot</DialogTitle>
              <DialogContent>
                <CircularProgress aria-label="Loading loadout screenshot importer" />
              </DialogContent>
            </Dialog>
          }
        >
          <ImportImageDialog
            key={`${mode}:${id ?? "new"}`}
            editable={isPresetEditable && !isPresetLoading}
            onClose={() => setImageImportOpen(false)}
          />
        </Suspense>
      )}

      <Dialog
        open={uploadConfirmOpen}
        onClose={() => setUploadConfirmOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Upload to Cloud</DialogTitle>

        <DialogContent>
          <DialogContentText>
            Once uploaded, this preset will become read-only for most users. To
            make changes, you will need to either:
          </DialogContentText>

          <DialogContentText sx={{ mt: 2 }}>
            1. Duplicate via the "New Preset" button; or
            <br />
            2. Ask a PvME Editing Staff member to update it for you
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setUploadConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUploadToCloud}
            variant="contained"
            startIcon={isUploading ? undefined : <CloudIcon />}
            disabled={isUploading}
          >
            {isUploading ? <CircularProgress size={20} /> : "Upload to Cloud"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PresetMenu;
