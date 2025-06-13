import React, { useState } from 'react';

import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetName } from '../PresetLoader/PresetLoader';

import { Fade } from '@mui/material';
import { PresetActions } from '../PresetActions/PresetActions';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import './PresetSection.css';

export const PresetSection = (): JSX.Element => {
  return (
    <Fade in={true}>
      <div className="preset-section">
        <PresetName />
        <div className="preset-section__inner d-flex">
          <PresetEditor />
          <div className="preset-section__sidebar">
            <PresetDetails />
            <PresetActions />
          </div>
        </div>
        <PresetBreakdown />
      </div>
    </Fade>
  );
};
