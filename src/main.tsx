import { SnackbarProvider, useSnackbar, type SnackbarKey } from "notistack";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { HashRouter, Route, Routes } from "react-router-dom";

import CloseIcon from "@mui/icons-material/Close";
import CssBaseline from "@mui/material/CssBaseline";
import IconButton from "@mui/material/IconButton";
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material/styles";

import App from "./App";
import { ReduxStore } from "./redux/store/store";

import "./index.css";

interface SnackBarAction {
  snackbarKey: SnackbarKey;
}

function SnackbarCloseButton({ snackbarKey }: SnackBarAction): JSX.Element {
  const { closeSnackbar } = useSnackbar();

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)}>
      <CloseIcon htmlColor="white" />
    </IconButton>
  );
}

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <StyledEngineProvider injectFirst>
        <Provider store={ReduxStore}>
          <SnackbarProvider
            maxSnack={3}
            action={(snackBarKey) => (
              <SnackbarCloseButton snackbarKey={snackBarKey} />
            )}
            autoHideDuration={3000}
          >
            <CssBaseline />
            <HashRouter
              future={{
                v7_relativeSplatPath: true,
                v7_startTransition: true,
              }}
            >
              <Routes>
                <Route path="/:id?" element={<App />} />
              </Routes>
            </HashRouter>
          </SnackbarProvider>
        </Provider>
      </StyledEngineProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
