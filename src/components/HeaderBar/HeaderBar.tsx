import { useSnackbar } from "notistack";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";

import "./HeaderBar.css";
import { HelpDialog } from "../HelpDialog/HelpDialog";

import {
  getAuth,
  signInWithCustomToken,
  signOut,
} from "../../utility/firebase-init";

function getHashUrl(url: URL): URL | null {
  if (!url.hash) return null;

  const hashRoute = url.hash.slice(1);
  return new URL(
    hashRoute.startsWith("/")
      ? `http://preset-maker${hashRoute}`
      : `http://preset-maker/${hashRoute}`,
  );
}

function getAuthTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  const token = url.searchParams.get("authToken");
  if (token) return token;

  return getHashUrl(url)?.searchParams.get("authToken") ?? null;
}

function removeAuthTokenFromUrl(): string {
  const url = new URL(window.location.href);
  url.searchParams.delete("authToken");

  const hashUrl = getHashUrl(url);
  if (hashUrl) {
    hashUrl.searchParams.delete("authToken");
    const query = hashUrl.searchParams.toString();
    url.hash = `${hashUrl.pathname}${query ? `?${query}` : ""}`;
  }

  return url.toString();
}

export const HeaderBar = (): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  const [username, setUsername] = React.useState<string | null>(null);

  const onHomeClick = useCallback(() => {
    navigate("/");
    navigate(0);
  }, [navigate]);

  const handleHelpOpen = useCallback(() => setHelpDialogOpen(true), []);
  const handleHelpClose = useCallback(() => setHelpDialogOpen(false), []);
  const handleLogout = useCallback(async () => {
    try {
      await signOut(getAuth());
      enqueueSnackbar("Logged out", { variant: "success" });
    } catch {
      enqueueSnackbar("Logout failed", { variant: "error" });
    }
  }, [enqueueSnackbar]);

  //
  // -------------------------------
  //   LOGIN TOKEN PROCESSING
  // -------------------------------
  //
  React.useEffect(() => {
    const token = getAuthTokenFromUrl();
    if (!token) return;

    const auth = getAuth();

    signInWithCustomToken(auth, token)
      .then(() => {
        window.history.replaceState({}, "", removeAuthTokenFromUrl());

        // Extract username from claims
        auth.currentUser?.getIdTokenResult().then((r) => {
          const uname = (r.claims as any).username;
          setUsername(typeof uname === "string" ? uname : null);
        });

        enqueueSnackbar("Logged in!", { variant: "success" });
      })
      .catch(() => enqueueSnackbar("Login failed", { variant: "error" }));
  }, [enqueueSnackbar]);

  //
  // Show error for unauthorised logins
  //
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const err = url.searchParams.get("auth_error");

    if (err === "unauthorised") {
      enqueueSnackbar("You're not authorised to access admin features.", {
        variant: "error",
      });

      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [enqueueSnackbar]);

  //
  // Track login state
  //
  React.useEffect(() => {
    const auth = getAuth();
    return auth.onIdTokenChanged(async (user) => {
      if (!user) return setUsername(null);
      const res = await user.getIdTokenResult();
      const uname = (res.claims as any).username;
      setUsername(typeof uname === "string" ? uname : null);
    });
  }, []);

  return (
    <>
      <Box className="header-bar">
        <AppBar position="sticky" className="header-bar__app-bar" elevation={2}>
          <Container maxWidth="xl">
            <Toolbar
              disableGutters
              className="header-bar__toolbar"
              sx={{
                minHeight: { xs: 64, sm: 80 },
                px: { xs: 1, sm: 2 },
              }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                className="header-bar__logo-section"
              >
                <Tooltip title="Go to Home">
                  <IconButton
                    onClick={onHomeClick}
                    className="header-bar__logo-button"
                    size="large"
                    edge="start"
                  >
                    <Box
                      component="img"
                      src="https://img.pvme.io/images/EPzzJe2xy6.gif"
                      alt="PvME Logo"
                      className="header-bar__logo-image"
                      sx={{
                        width: { xs: 60, sm: 80 },
                        height: { xs: 60, sm: 80 },
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Typography
                variant={isMobile ? "h6" : "h5"}
                component="h1"
                className="header-bar__title"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 600,
                  flexGrow: 1,
                  textAlign: { xs: "center", md: "left" },
                  ml: { xs: 0, md: 2 },
                }}
              >
                PvME Preset Generator
              </Typography>

              <Box className="header-bar__actions">
                {username ? (
                  <>
                    <Typography
                      variant="body2"
                      className="header-bar__username"
                      sx={{ opacity: 0.7, mr: 1 }}
                    >
                      Logged in as {username}
                    </Typography>
                    <Tooltip title="Logout">
                      <IconButton
                        className="header-bar__logout-button"
                        onClick={handleLogout}
                        color="inherit"
                        size={isMobile ? "small" : "medium"}
                      >
                        <LogoutIcon />
                      </IconButton>
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip title="Admin Login">
                    <IconButton
                      className="header-bar__admin-button"
                      onClick={() => {
                        window.location.href =
                          "https://authstartv2-bi6xdqcqpq-uc.a.run.app?redirect=" +
                          encodeURIComponent(window.location.href);
                      }}
                      color="inherit"
                      size={isMobile ? "small" : "medium"}
                    >
                      <AdminPanelSettingsIcon />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title="Help">
                  <IconButton
                    onClick={handleHelpOpen}
                    className="header-bar__help-button"
                    color="inherit"
                    size={isMobile ? "small" : "medium"}
                  >
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>

      <HelpDialog open={helpDialogOpen} onClose={handleHelpClose} />
    </>
  );
};
