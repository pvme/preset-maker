import React, { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";

export type StorageMode = "local" | "cloud";

interface StorageModeContextProps {
  mode: StorageMode;
  setMode: (mode: StorageMode) => void;
  isPresetEditable: boolean;
}

const StorageModeContext = createContext<StorageModeContextProps | undefined>(
  undefined,
);

export const StorageModeProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [mode, setMode] = useState<StorageMode>("local");
  const { isLoggedIn } = useAuth();

  const isPresetEditable =
    mode === "local" || (mode === "cloud" && isLoggedIn);

  return (
    <StorageModeContext.Provider
      value={{ mode, setMode, isPresetEditable }}
    >
      {children}
    </StorageModeContext.Provider>
  );
};

export const useStorageMode = (): StorageModeContextProps => {
  const context = useContext(StorageModeContext);
  if (!context) {
    throw new Error("useStorageMode must be used within a StorageModeProvider");
  }
  return context;
};
