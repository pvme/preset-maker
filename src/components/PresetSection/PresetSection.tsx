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
      <Container className="preset-section">
        
        <Grid container spacing={2} direction="column">
          <Grid item>
            <PresetMenu />
          </Grid>

          <Grid item>
            <Grid container direction="row">
              <Grid item>
                <PresetEditor />
              </Grid>
              <Grid item xs
              sx={{
                '& .MuiPaper-root': {
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                },
              }}>
                <PresetDetails />
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