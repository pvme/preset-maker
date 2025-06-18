import React from 'react';

import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import PresetMenu from '../Menu/Menu';

import { Container, Fade, Grid, Paper } from '@mui/material';
import './PresetSection.css';

export const PresetSection = (): JSX.Element => {
  return (
    <Fade in={true}>
      <Container maxWidth="lg" className="preset-section">
        <Grid container spacing={2} direction="column">
          <Grid item>
            <PresetMenu />
          </Grid>

          <Grid item>
            <Grid container spacing={2} direction={{ xs: 'column', md: 'row' }}>
              <Grid item xs={12} md={8}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <PresetEditor />
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <PresetDetails />
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Grid item>
            <PresetBreakdown />
          </Grid>
        </Grid>
      </Container>
    </Fade>
  );
};