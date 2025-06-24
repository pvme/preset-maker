import React, { createContext, useContext, useState, ReactNode } from 'react';

export type StorageMode = 'local' | 'cloud';

interface StorageModeContextProps {
  mode: StorageMode;
  setMode: (mode: StorageMode) => void;
}

const StorageModeContext = createContext<StorageModeContextProps | undefined>(undefined);

export const StorageModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<StorageMode>('local');

  return (
    <StorageModeContext.Provider value={{ mode, setMode }}>
      {children}
    </StorageModeContext.Provider>
  );
};

export const useStorageMode = (): StorageModeContextProps => {
  const context = useContext(StorageModeContext);
  if (!context) {
    throw new Error('useStorageMode must be used within a StorageModeProvider');
  }
  return context;
};
