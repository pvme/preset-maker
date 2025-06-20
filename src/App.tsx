import React, { useEffect, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { HeaderBar } from './components/HeaderBar/HeaderBar'
import { PresetSection } from './components/PresetSection/PresetSection'
import { useSnackbar } from 'notistack';
import { useParams } from 'react-router-dom'
import { useAppDispatch } from './redux/hooks'
import { getPreset } from './api/get-preset'
import { importDataAction, resetToInitialState } from './redux/store/reducers/preset-reducer'
import { Typography } from '@mui/material'
import './App.css'
import './Dialog.css'

function App(): JSX.Element {
  const dispatch = useAppDispatch()

  const { enqueueSnackbar } = useSnackbar();

  const [isPresetLoading, setIsPresetLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhrase, setLoadingPhrase] = useState('')

  const loadingPhrases = [
    'Cooking some blue blubbers...',
    'Fishing for green blubbers...',
    'Preparing overload potions...',
    'Buying aura resets...',
    'Sharpening your Ek-Zekkil...',
    'Polishing your FSOA...',
    'Calling your Ripper Demon...',
    'Bankstanding in War’s Retreat...',
    'Disassembling for dummys...',
    'Paying death costs...',
  ]

  // Grab the route param named id
  const { id } = useParams<{ id?: string }>()

  // Simulate loading progress animation
  useEffect(() => {
    if (isPresetLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 100)
      return () => clearInterval(interval)
    } else {
      setLoadingProgress(0)
    }
  }, [isPresetLoading])

  useEffect(() => {
    let didCancel = false;

    if (!id) {
      dispatch(resetToInitialState());
      return;
    }

    setIsPresetLoading(true);
    setLoadingPhrase(loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);

    getPreset(id)
      .then(response => {
        if (!didCancel) {
          dispatch(importDataAction(response));
          setLoadingProgress(100);
          setTimeout(() => setIsPresetLoading(false), 300);
        }
      })
      .catch(err => {
        if (!didCancel) {
          enqueueSnackbar("Oops, we couldn't find that preset!", { variant: 'error' });
          console.error('Failed to load preset', err);
          setIsPresetLoading(false);
        }
      });

    return () => {
      didCancel = true;
    };
  }, [id, dispatch]);


  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-container">
        <div className="background-gradient"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        {isPresetLoading ? (
          <div className="loading-container">
            <div className="loading-card">
              <div className="loading-spinner-wrapper">
                <div className="modern-spinner">
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                  <div className="spinner-ring"></div>
                </div>
              </div>
              <div className="loading-content">
                <Typography variant="h5" className="loading-title">
                  Loading Your Preset
                </Typography>
                <Typography variant="body1" className="loading-subtitle">
                  {loadingPhrase}
                </Typography>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
                <Typography variant="body2" className="progress-text">
                  {Math.round(loadingProgress)}%
                </Typography>
              </div>
            </div>
          </div>
        ) : (
          <div className="app-content">
            <HeaderBar />
            <PresetSection />
          </div>
        )}
      </div>
    </DndProvider>
  )
}

export default App
