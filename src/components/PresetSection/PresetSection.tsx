import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAppDispatch } from "../../redux/hooks";
import { importDataAction } from "../../redux/store/reducers/preset-reducer";
import { PresetBreakdown } from "../PresetBreakdown/PresetBreakdown";
import { PresetEditor } from "../PresetEditor/PresetEditor";
import { PresetName } from "../PresetLoader/PresetLoader";

import { GetPreset } from "./presetSectionApi";

import "./PresetSection.css";

export const PresetSection = () => {
  const dispatch = useAppDispatch();

  const [preset, setPreset] = useState<any>();
  // grab id from url params
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      return;
    }

    // load preset from URL if code exists
    const getPresetData = async () => {
      const response = await GetPreset(id);
      dispatch(importDataAction(response));
    };

    getPresetData();
  }, [id]);

  return (
    <div className="preset-section">
      <PresetName />
      <PresetEditor />
      <PresetBreakdown />
    </div>
  );
};
