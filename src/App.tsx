import React, { useEffect, useRef, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { HeaderBar } from './components/HeaderBar/HeaderBar';
import { PresetSection } from './components/PresetSection/PresetSection';

import './App.css';
import './Dialog.css';
import { useParams } from 'react-router';
import { useAppDispatch } from './redux/hooks';
import { getPreset } from './api/get-preset';
import { importDataAction } from './redux/store/reducers/preset-reducer';
import { CircularProgress, Typography } from '@mui/material';

function App (): JSX.Element {
  const dispatch = useAppDispatch();
  const [isPresetLoading, setIsPresetLoading] = useState(false);
  const presetImported = useRef(false);

  // Preset ID is stored in URL params
  const { id } = useParams();

  const imageThumbnailUrl = `http://127.0.0.1:3000/?id=${id}`;
  document!.querySelector('meta[property="og:image"]')!.setAttribute("content", imageThumbnailUrl);
  document!.querySelector('meta[property="twitter:image:src"]')!.setAttribute("content", imageThumbnailUrl);


  useEffect(() => {
    if (presetImported.current) {
      return;
    }

    // load preset from URL if code exists
    const getPresetData = async (): Promise<void> => {
      if (id === undefined) {
        return;
      }

      presetImported.current = true;
      setIsPresetLoading(true);
      const response = await getPreset(id);
      dispatch(importDataAction(response));
      setIsPresetLoading(false);
    };

    void getPresetData();
  }, [id]);

  return (
    <DndProvider backend={HTML5Backend}>
      {isPresetLoading
        ? <div className="height-100 d-flex flex-center">
          <CircularProgress />
          <Typography className="m-16" variant="h6">
            Loading preset...
          </Typography>
        </div>
        : (
        <div className="App">
          <HeaderBar />
          <PresetSection />
        </div>
          )
      }
    </DndProvider>
  );
}

export default App;
