// src/App.tsx

import React, { useEffect, useRef, useState } from "react";
import { HTML5Backend } from "react-dnd-html5-backend";
import { DndProvider } from "react-dnd";
import { HeaderBar } from "./components/HeaderBar/HeaderBar";
import { PresetPage } from "./components/PresetPage/PresetPage";
import { AuthProvider } from "./auth/AuthContext";
import {
  GlobalLoadingProvider,
  useGlobalLoading,
} from "./storage/GlobalLoadingContext";
import { PresetLoadProvider, usePresetLoad } from "./storage/PresetLoadContext";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "./redux/hooks";
import { resetToInitialState } from "./redux/store/reducers/preset-reducer";
import {
  StorageModeProvider,
  useStorageMode,
} from "./storage/StorageModeContext";
import { Typography } from "@mui/material";

import "./App.css";
import "./Dialog.css";

function AppContent(): JSX.Element {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id?: string }>();
  const { isPresetLoading, setIsPresetLoading } = usePresetLoad();
  const { setMode } = useStorageMode();

  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const { isGlobalLoading, loadingText } = useGlobalLoading();
  const lastLoadingStateRef = useRef(false);

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
    if (isPresetLoading && !lastLoadingStateRef.current) {
      setLoadingPhrase(
        loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)],
      );
    }

    lastLoadingStateRef.current = isPresetLoading;

    if (isPresetLoading) {
      const interval = setInterval(() => {
        setLoadingProgress((prev) =>
          prev >= 90 ? prev : prev + Math.random() * 15,
        );
      }, 100);
      return () => clearInterval(interval);
    }

    setLoadingProgress(0);
  }, [isPresetLoading]);

  useEffect(() => {
    if (id) return;

    dispatch(resetToInitialState());
    setMode("local");
    setIsPresetLoading(false);
  }, [id, dispatch, setMode, setIsPresetLoading]);

  const showOverlay = isGlobalLoading || isPresetLoading;

  return (
    <div className="app-container">
      <div className="background-gradient"></div>

      <DndProvider backend={HTML5Backend}>
        <div className="app-content">
          <HeaderBar />
          <PresetPage />
        </div>
      </DndProvider>

      {showOverlay && (
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
      )}
    </div>
  );
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <GlobalLoadingProvider>
        <StorageModeProvider>
          <PresetLoadProvider>
            <AppContent />
          </PresetLoadProvider>
        </StorageModeProvider>
      </GlobalLoadingProvider>
    </AuthProvider>
  );
}

export default App;
