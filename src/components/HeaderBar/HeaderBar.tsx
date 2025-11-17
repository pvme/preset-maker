import { useSnackbar } from 'notistack';
import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import './HeaderBar.css';
import { HelpDialog } from '../HelpDialog/HelpDialog';

import { getAuth, signInWithCustomToken } from "../../utility/firebase-init";

export const HeaderBar = (): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  const [username, setUsername] = React.useState<string | null>(null);

  const onHomeClick = useCallback(() => {
    navigate('/');
    navigate(0);
  }, [navigate]);

  const handleHelpOpen = useCallback(() => setHelpDialogOpen(true), []);
  const handleHelpClose = useCallback(() => setHelpDialogOpen(false), []);

  //
  // -------------------------------
  //   LOGIN TOKEN PROCESSING
  // -------------------------------
  //
  React.useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("authToken");
    if (!token) return;

    const auth = getAuth();

    signInWithCustomToken(auth, token)
      .then(() => {
        //
        // CLEAN THE URL PROPERLY:
        // remove authToken while preserving hash route (#/id)
        //
        const cleanUrl = (() => {
          const full = window.location.href;
          const [base, hash] = full.split("#");

          // No hash? fallback
          if (!hash) {
            url.searchParams.delete("authToken");
            return url.toString();
          }

          // Parse inside hash ("/id?authToken=x")
          const hashUrl = new URL("http://x/" + hash.replace(/^\//, ""));
          hashUrl.searchParams.delete("authToken");

          // Rebuild hash
          let newHash = hashUrl.pathname;
          const qs = hashUrl.searchParams.toString();
          if (qs) newHash += "?" + qs;

          return `${base}#${newHash}`;
        })();

        window.history.replaceState({}, "", cleanUrl);

        // Extract username from claims
        auth.currentUser?.getIdTokenResult().then(r => {
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
      enqueueSnackbar("You're not authorised to access admin features.", { variant: "error" });

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
        <AppBar 
          position="sticky" 
          className="header-bar__app-bar"
          elevation={2}
        >
          <Container maxWidth="xl">
            <Toolbar 
              disableGutters 
              className="header-bar__toolbar"
              sx={{ 
                minHeight: { xs: 64, sm: 80 },
                px: { xs: 1, sm: 2 }
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
                        height: { xs: 60, sm: 80 }
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Typography
                variant={isMobile ? 'h6' : 'h5'}
                component="h1"
                className="header-bar__title"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  flexGrow: 1,
                  textAlign: { xs: 'center', md: 'left' },
                  ml: { xs: 0, md: 2 }
                }}
              >
                PvME Preset Generator
              </Typography>

              <Box className="header-bar__actions">

                {username ? (
                  <Typography
                    variant="body2"
                    sx={{ opacity: 0.7, mr: 2 }}
                  >
                    Logged in as {username}
                  </Typography>
                ) : (
                  <Tooltip title="Admin Login">
                    <IconButton
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
                    size={isMobile ? 'small' : 'medium'}
                  >
                    <HelpOutlineIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </Box>
      
      <HelpDialog
        open={helpDialogOpen}
        onClose={handleHelpClose}
      />
    </>
  );
};
