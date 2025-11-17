// src/utility/firebase-init.ts

import { initializeApp } from "firebase/app";
import {
  getAuth as _getAuth,
  signInWithCustomToken as _signInWithCustomToken,
  onAuthStateChanged as _onAuthStateChanged
} from "firebase/auth";

let app: any = null;

function ensureFirebase() {
  if (!app) {
    app = initializeApp({
      apiKey: "AIzaSyA23nxzVuxxx5SDmC-C2Kxg4_8R7FzHkaU",
      authDomain: "pvmebackend.firebaseapp.com",
      projectId: "pvmebackend",
    });
  }
}

export function getAuth() {
  ensureFirebase();
  return _getAuth();
}

export function signInWithCustomToken(auth: any, token: string) {
  ensureFirebase();
  return _signInWithCustomToken(auth, token);
}

export function onAuthStateChanged(auth: any, callback: (user: any) => void) {
  ensureFirebase();
  return _onAuthStateChanged(auth, callback);
}
