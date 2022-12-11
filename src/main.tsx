import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { SnackbarKey, SnackbarProvider, useSnackbar } from "notistack";

import { StyledEngineProvider } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <Provider store={ReduxStore}>
        <SnackbarProvider
          maxSnack={3}
          action={(snackBarKey) => <SnackbarCloseButton snackbarKey={snackBarKey} />}
          autoHideDuration={3000}
        >
          <App />
        </SnackbarProvider>
      </Provider>
    </StyledEngineProvider>
  </React.StrictMode>
);
