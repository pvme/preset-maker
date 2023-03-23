import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { SnackbarKey, SnackbarProvider, useSnackbar } from "notistack";

import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CssBaseline from "@mui/material/CssBaseline";

import App from "./App";
import { ReduxStore } from "./redux/store/store";

import "./index.css";

interface SnackBarAction {
  snackbarKey: SnackbarKey;
}

function SnackbarCloseButton({ snackbarKey }: SnackBarAction) {
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

export const router = createHashRouter([
  {
    path: "/preset-maker/:id?",
    element: <App />,
  },
]);

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
            <RouterProvider router={router} />
          </SnackbarProvider>
        </Provider>
      </StyledEngineProvider>
    </ThemeProvider>
  </React.StrictMode>
);
