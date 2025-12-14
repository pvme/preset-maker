import React from 'react';

import { PresetBreakdown } from '../PresetBreakdown/PresetBreakdown';
import { PresetEditor } from '../PresetEditor/PresetEditor';
import { PresetDetails } from '../PresetDetails/PresetDetails';
import PresetMenu from '../Menu/Menu';

import { Container, Fade, Grid } from '@mui/material';
import './PresetSection.css';

export const PresetSection = (): JSX.Element => {
  return (
    <>
      <Container>
        <Grid container spacing={2} direction="column">
          <Grid item>
            <PresetMenu />
          </Grid>

          <Grid item>
            <Grid container direction="row">
              <Grid item>
                <PresetEditor />
              </Grid>
              <Grid
                item
                xs
                sx={{
                  '& .MuiPaper-root': {
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    marginTop: 2
                  },
                }}
              >
                <PresetDetails />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth={'xl'}>
        <Grid container sx={{ marginBottom: 3}} >
          <Grid item xs={12}>
            <PresetBreakdown />
          </Grid>
        </Grid>
      </Container>
    </>
  );
};
