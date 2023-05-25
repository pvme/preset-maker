import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAppDispatch } from '../../redux/hooks';
import { importDataAction } from '../../redux/store/reducers/preset-reducer';
import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetName } from '../PresetLoader/PresetLoader';

import { getPreset } from '../../api/get-preset';

import { Fade, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import { PresetActions } from '../PresetActions/PresetActions';
import './PresetSection.css';
import { PresetDetails } from '../PresetDetails/PresetDetails';

export const PresetSection = (): JSX.Element => {
  const dispatch = useAppDispatch();

  const [presetExportRef, setPresetExportRef] = useState<HTMLDivElement | null>(null);
  const [isPresetLoading, setIsPresetLoading] = useState(false);

  // Preset ID is stored in URL params
  const { id } = useParams();

  useEffect(() => {
    // load preset from URL if code exists
    const getPresetData = async (): Promise<void> => {
      if (id === undefined) {
        return;
      }

      setIsPresetLoading(true);
      const response = await getPreset(id);
      dispatch(importDataAction(response));
      setIsPresetLoading(false);
    };

    void getPresetData();
  }, [id]);

  const presetExportRefCallback = (ref: HTMLDivElement): void => {
    setPresetExportRef(ref);
  };

  return (
    <>
      {isPresetLoading
        ? <div className="preset-section--loading">
          <CircularProgress />
          <Typography className="mt-8" variant="h6">
            Loading preset...
          </Typography>
        </div>
        : (
          <Fade in={!isPresetLoading}>
            <div className="preset-section">
              <PresetName />
              <div className="d-flex">
                <PresetEditor
                  setExportRef={presetExportRefCallback}
                />
                <div className="preset-section__sidebar">
                  <PresetDetails />
                  <PresetActions
                    presetExportRef={presetExportRef}
                  />
                </div>
              </div>
              <PresetBreakdown />
            </div>
          </Fade>
          )
      }
    </>
  );
};
