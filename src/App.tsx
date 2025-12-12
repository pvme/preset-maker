// src/App.tsx

import React, { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { HeaderBar } from "./components/HeaderBar/HeaderBar";
import { PresetSection } from "./components/PresetSection/PresetSection";
import {
  GlobalLoadingProvider,
  useGlobalLoading,
} from "./storage/GlobalLoadingContext";
import {
  PresetLoadProvider,
  usePresetLoad,
} from "./storage/PresetLoadContext";
import { useSnackbar } from "notistack";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "./redux/hooks";
import { loadPresetById } from "./storage/preset-storage";
import {
  importDataAction,
  resetToInitialState,
} from "./redux/store/reducers/preset-reducer";
import { StorageModeProvider } from "./storage/StorageModeContext";
import { Typography } from "@mui/material";

import "./App.css";
import "./Dialog.css";

function AppContent(): JSX.Element {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id?: string }>();
  const { skipNextLoad, setSkipNextLoad } = usePresetLoad();

  const [isPresetLoading, setIsPresetLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const { isGlobalLoading, loadingText } = useGlobalLoading();

  const loadingPhrases = [
    "Cooking some blue blubbers...",
    "Fishing for green blubbers...",
    "Preparing overload potions...",
    "Buying aura resets...",
    "Sharpening your Ek-Zekkil...",
    "Polishing your FSOA...",
    "Calling your Ripper Demon...",
    "Bankstanding in War’s Retreat...",
    "Disassembling for dummys...",
    "Paying death costs...",
  ];

  useEffect(() => {
    if (isPresetLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) =>
          prev >= 90 ? prev : prev + Math.random() * 15
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(0);
    }
  }, [isPresetLoading]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    if (skipNextLoad) {
      setSkipNextLoad(false);
      return;
    }

    if (!id) {
      dispatch(resetToInitialState());
      return;
    }

    setIsPresetLoading(true);
    setLoadingPhrase(
      loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]
    );

    loadPresetById(id)
      .then(({ data }) => {
        if (signal.aborted) return;

        dispatch(importDataAction(data));

        setLoadingProgress(100);
        setTimeout(() => setIsPresetLoading(false), 300);
      })
      .catch((err) => {
        if (signal.aborted) return;
        enqueueSnackbar(`Preset not found for ID ${id}`, { variant: "error" });
        console.error("Failed to load preset", err);
        setIsPresetLoading(false);
      });

    return () => controller.abort();
  }, [id, dispatch, enqueueSnackbar, skipNextLoad, setSkipNextLoad]);

  const showOverlay = isGlobalLoading || isPresetLoading;

  return (
    <div className="app-container">
      <div className="background-gradient"></div>
      
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

        {showOverlay ? (
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
                  {isGlobalLoading ? "Saving Preset" : "Loading Your Preset"}
                </Typography>

                <Typography variant="body1" className="loading-subtitle">
                  {isGlobalLoading
                    ? loadingText || "Saving to cloud…"
                    : loadingPhrase}
                </Typography>

                {!isGlobalLoading && (
                  <>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <Typography variant="body2" className="progress-text">
                      {Math.round(loadingProgress)}%
                    </Typography>
                  </>
                )}
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
  );
}

function App(): JSX.Element {
  return (
    <GlobalLoadingProvider>
      <StorageModeProvider>
        <PresetLoadProvider>
          <DndProvider backend={HTML5Backend}>
            <AppContent />
          </DndProvider>
        </PresetLoadProvider>
      </StorageModeProvider>
    </GlobalLoadingProvider>
  );
}

export default App;
