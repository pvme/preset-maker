import React, { useState } from 'react';
import ScrollIntoView from 'react-scroll-into-view';

import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetName } from '../PresetLoader/PresetLoader';

import { Fab, Fade } from '@mui/material';
import { PresetActions } from '../PresetActions/PresetActions';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import './PresetSection.css';
import { isMobile } from '../../utility/window-utils';

const isMobileScreen = isMobile();

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
        {isMobileScreen &&
          <ScrollIntoView selector=".breakdown-container" alignToTop={true}>
            <Fab variant="extended" size="small" color="info" className="preset-section__jump-to-breakdown">
              Jump to breakdown
            </Fab>
          </ScrollIntoView>
        }
        <PresetBreakdown />
      </div>
    </Fade>
  );
};
