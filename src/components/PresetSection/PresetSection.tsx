import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { useAppDispatch } from "../../redux/hooks";
import { importDataAction } from "../../redux/store/reducers/preset-reducer";
import { PresetBreakdown } from "../PresetBreakdown/PresetBreakdown";
import { PresetEditor } from "../PresetEditor/PresetEditor";
import { PresetName } from "../PresetLoader/PresetLoader";

import { getPreset } from "../../api/get-preset";

import "./PresetSection.css";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import { Fade, Typography } from "@mui/material";
import { PresetActions } from "../PresetActions/PresetActions";

export const PresetSection = () => {
  const dispatch = useAppDispatch();

  // const presetExportRef = useRef<HTMLDivElement>(null);
  const [presetExportRef, setPresetExportRef] = useState<HTMLDivElement | null>(null);
  const [isPresetLoading, setIsPresetLoading] = useState(false);

  // Preset ID is stored in URL params
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      return;
    }

    // load preset from URL if code exists
    const getPresetData = async () => {
      setIsPresetLoading(true);
      const response = await getPreset(id);
      dispatch(importDataAction(response));
      setIsPresetLoading(false);
    };

    getPresetData();
  }, [id]);

  const presetExportRefCallback = (ref: HTMLDivElement) => {
    setPresetExportRef(ref);
  }

  return (
    <>
      {isPresetLoading
        ?
        <div className="preset-section--loading">
          <CircularProgress />
          <Typography className="mt-8" variant="h6">
            Loading preset...
          </Typography>
        </div>
        : (
          <Fade in={!isPresetLoading}>
            <div className="preset-section">
              <PresetName />
              <div className="preset-and-actions">
                <PresetEditor
                  setExportRef={presetExportRefCallback}
                />
                <PresetActions
                  presetExportRef={presetExportRef}
                />
              </div>
              <PresetBreakdown />
            </div>
          </Fade>
        )
      }
    </>
  );
};
