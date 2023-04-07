import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAppDispatch } from "../../redux/hooks";
import { importDataAction } from "../../redux/store/reducers/preset-reducer";
import { PresetBreakdown } from "../PresetBreakdown/PresetBreakdown";
import { PresetEditor } from "../PresetEditor/PresetEditor";
import { PresetName } from "../PresetLoader/PresetLoader";

import { GetPreset } from "./presetSectionApi";

import "./PresetSection.css";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";
import { Fade, Typography } from "@mui/material";

export const PresetSection = () => {
  const dispatch = useAppDispatch();

  const [isPresetLoading, setIsPresetLoading] = useState(false);
  const [preset, setPreset] = useState<any>();
  // grab id from url params
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      return;
    }

    // load preset from URL if code exists
    const getPresetData = async () => {
      setIsPresetLoading(true);
      const response = await GetPreset(id);
      dispatch(importDataAction(response));
      setIsPresetLoading(false);
    };

    getPresetData();
  }, [id]);

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
              <PresetEditor />
              <PresetBreakdown />
            </div>
          </Fade>
        )
      }
    </>
  );
};
