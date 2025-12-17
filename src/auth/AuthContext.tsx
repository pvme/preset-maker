// src/auth/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "../utility/firebase-init";

type AuthState = {
  username: string | null;
  isLoggedIn: boolean;
};

const AuthContext = createContext<AuthState>({
  username: null,
  isLoggedIn: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();

    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsername(null);
        return;
      }

      const res = await user.getIdTokenResult();
      const uname = (res.claims as any)?.username;

      setUsername(typeof uname === "string" ? uname : null);
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        username,
        isLoggedIn: !!username,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
