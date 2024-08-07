import React, { useState } from 'react';

import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetName } from '../PresetLoader/PresetLoader';

import { Fade } from '@mui/material';
import { PresetActions } from '../PresetActions/PresetActions';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import './PresetSection.css';
import App, { AppMode } from '../../App';

export const PresetSection = ({ mode }: { mode: AppMode }): JSX.Element => {
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
            <PresetDetails mode={mode} />
            {mode === AppMode.Edit &&
              <PresetActions
                presetExportRef={presetExportRef}
              />
            }
          </div>
        </div>
        <PresetBreakdown mode={mode} />
      </div>
    </Fade>
  );
};
