import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { useAppDispatch } from "../../redux/hooks";
import { importDataAction } from "../../redux/store/reducers/preset-reducer";
import { PresetBreakdown } from "../PresetBreakdown/PresetBreakdown";
import { PresetEditor } from "../PresetEditor/PresetEditor";
import { PresetName } from "../PresetLoader/PresetLoader";
import relicIconPath from '../../assets/relic.png';
import summoningIconPath from '../../assets/summoning.png';

import "./FamiliarSection.css";
import Typography from "@mui/material/Typography/Typography";

export const FamiliarSection = () => {
  // const dispatch = useAppDispatch();

  return (
    <div className="familiar-section width-50">
      <Typography className="d-flex flex-center" variant="h6">
        <img
          className="m-8"
          width={24}
          height={24}
          src={summoningIconPath}
        />
        Familiar
      </Typography>
    </div>
  );
};