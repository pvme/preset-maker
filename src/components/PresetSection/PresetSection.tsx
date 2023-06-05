import React, { useState } from 'react';

import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetName } from '../PresetLoader/PresetLoader';

import { Fade } from '@mui/material';
import { PresetActions } from '../PresetActions/PresetActions';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import './PresetSection.css';

export const PresetSection = (): JSX.Element => {
  const [presetExportRef, setPresetExportRef] = useState<HTMLDivElement | null>(null);

  const presetExportRefCallback = (ref: HTMLDivElement): void => {
    setPresetExportRef(ref);
  };

  return (
    <Fade in={true}>
      <div className="preset-section">
        <PresetName />
        <div className="preset-section__inner d-flex">
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
  );
};
