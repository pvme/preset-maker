// src/storage/PresetLoadContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface PresetLoadContextType {
  skipNextLoad: boolean;
  setSkipNextLoad: (value: boolean) => void;
}

const PresetLoadContext = createContext<PresetLoadContextType | undefined>(undefined);

export const PresetLoadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [skipNextLoad, setSkipNextLoad] = useState(false);
  return (
    <PresetLoadContext.Provider value={{ skipNextLoad, setSkipNextLoad }}>
      {children}
    </PresetLoadContext.Provider>
  );
};

export const usePresetLoad = (): PresetLoadContextType => {
  const context = useContext(PresetLoadContext);
  if (!context) throw new Error('usePresetLoad must be used inside PresetLoadProvider');
  return context;
};
