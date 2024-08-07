import React, { useState } from 'react';

import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetName } from '../PresetLoader/PresetLoader';

import { Fade } from '@mui/material';
import { PresetActions } from '../PresetActions/PresetActions';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import './PresetSection.css';
import { useAppSelector } from '../../redux/hooks';
import { AppMode, getMode } from '../../redux/store/reducers/setting-reducer';
import { Tips } from '../Tips/Tips';

export const PresetSection = (): JSX.Element => {
  const mode = useAppSelector(getMode);
  const [presetExportRef, setPresetExportRef] = useState<HTMLDivElement | null>(null);

  const presetExportRefCallback = (ref: HTMLDivElement): void => {
    setPresetExportRef(ref);
  };

  return (
    <Fade in={true}>
      <div className="preset-section">
        {mode === AppMode.Edit && <PresetName />}
        <div className="preset-section__inner d-flex">
          <PresetEditor
            setExportRef={presetExportRefCallback}
          />
          <div className="preset-section__sidebar">
            <PresetDetails />
            {mode === AppMode.Edit &&
              <PresetActions
                presetExportRef={presetExportRef}
              />
            }
            {mode === AppMode.View &&
              <Tips />
            }
          </div>
        </div>
        <PresetBreakdown />
      </div>
    </Fade>
  );
};
