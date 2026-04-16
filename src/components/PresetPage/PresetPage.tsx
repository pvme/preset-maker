import React from "react";

import { PresetNotes } from "../PresetNotes/PresetNotes";
import { PresetEditor } from "../PresetEditor/PresetEditor";
import { PresetInfo } from "../PresetInfo/PresetInfo";
import PresetMenu from "../PresetMenu/PresetMenu";

import { Container, Grid } from "@mui/material";
import "./PresetPage.css";

export const PresetPage = (): JSX.Element => {
  return (
    <div className="preset-page">
      <Container className="preset-page__menu">
        <Grid container spacing={2} direction="column">
          <Grid item>
            <PresetMenu />
          </Grid>
        </Grid>
      </Container>

      <Container className="preset-page__top">
        <Grid container spacing={0} className="preset-page__top-grid">
          <Grid item xs={12} md="auto" className="preset-page__editor">
            <PresetEditor />
          </Grid>

          <Grid
            item
            xs={12}
            md
            className="preset-page__info"
            sx={{
              "& .MuiPaper-root": {
                borderTopLeftRadius: { xs: undefined, md: 0 },
                borderBottomLeftRadius: { xs: undefined, md: 0 },
                marginTop: { xs: 0, md: 2 },
              },
            }}
          >
            <PresetInfo />
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="xl" className="preset-page__bottom">
        <Grid container>
          <Grid item xs={12}>
            <PresetNotes />
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};
