// src/storage/GlobalLoadingContext.tsx

import React, { createContext, useContext, useState, useRef } from 'react';

interface GlobalLoadingContextType {
  isGlobalLoading: boolean;
  loadingText: string;

  beginGlobalSave: (text?: string) => void;
  endGlobalSave: () => void;

  // (kept for backwards compatibility)
  setGlobalLoading: (value: boolean) => void;
  setLoadingText: (text: string) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const GlobalLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const saveDepth = useRef(0); // allows nested saves safely

  const beginGlobalSave = (text: string = "Saving to cloud…") => {
    saveDepth.current += 1;
    setLoadingText(text);
    setIsGlobalLoading(true);
  };

  const endGlobalSave = () => {
    saveDepth.current -= 1;
    if (saveDepth.current <= 0) {
      saveDepth.current = 0;
      setIsGlobalLoading(false);
      setLoadingText("");
    }
  };

  return (
    <GlobalLoadingContext.Provider
      value={{
        isGlobalLoading,
        loadingText,
        beginGlobalSave,
        endGlobalSave,
        setGlobalLoading: setIsGlobalLoading,
        setLoadingText
      }}
    >
      {children}
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = (): GlobalLoadingContextType => {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx) throw new Error("useGlobalLoading must be used inside GlobalLoadingProvider");
  return ctx;
};
