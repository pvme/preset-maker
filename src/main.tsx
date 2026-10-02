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
    primary: { main: "#e7c779", light: "#f1dca0", dark: "#b89b58", contrastText: "#17130e" },
    secondary: { main: "#b89b58", contrastText: "#17130e" },
    background: { default: "#100f0d", paper: "#211e19" },
    text: { primary: "#e6dcc7", secondary: "#b7aa90", disabled: "#776d5c" },
    divider: "#493b27",
    action: {
      hover: "rgba(184, 155, 88, 0.10)",
      selected: "rgba(184, 155, 88, 0.18)",
      focus: "rgba(231, 199, 121, 0.16)",
      disabled: "#776d5c",
      disabledBackground: "#302b23",
    },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none", boxShadow: "0 4px 16px rgba(0,0,0,.25), inset 0 0 0 1px #493b27" } } },
    MuiButton: { styleOverrides: { root: { borderRadius: 4 }, containedPrimary: { backgroundImage: "linear-gradient(rgba(255,255,255,.07),rgba(59,48,31,.12))" } } },
    MuiOutlinedInput: { styleOverrides: { notchedOutline: { borderColor: "#5c492e" }, root: { "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#b89b58" } } } },
    MuiDialogTitle: { styleOverrides: { root: { color: "#e7c779" } } },
    MuiListItemIcon: { styleOverrides: { root: { color: "#b89b58" } } },
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
