import { useSnackbar } from 'notistack';
import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  AppBar,
  Box,
  Button,
  ButtonGroup,
  Container,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Tooltip
} from '@mui/material';
import {
  HelpOutline as HelpOutlineIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import './HeaderBar.css';
import { HelpDialog } from '../HelpDialog/HelpDialog';

export const HeaderBar = (): JSX.Element => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [helpDialogOpen, setHelpDialogOpen] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  const onHomeClick = useCallback(() => {
    // go to root
    navigate('/');
    // refresh page to reset all data
    navigate(0);
  }, [navigate]);

  const handleHelpOpen = useCallback(() => {
    setHelpDialogOpen(true);
  }, []);

  const handleHelpClose = useCallback(() => {
    setHelpDialogOpen(false);
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
              {/* Logo Section */}
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
                      alt="PVME Logo"
                      className="header-bar__logo-image"
                      sx={{
                        width: { xs: 60, sm: 80 },
                        height: { xs: 60, sm: 80 }
                      }}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Title Section */}
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
                PVME Preset Generator
              </Typography>

              {/* Actions Section */}
              <Box className="header-bar__actions">
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