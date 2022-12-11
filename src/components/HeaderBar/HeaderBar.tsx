import { useCallback, useRef } from "react";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { importDataAction, selectPreset } from "../../redux/store/reducers/preset-reducer";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { exportAsJson } from "../../utility/export-to-json";

import "./HeaderBar.css";
import Container from "@mui/material/Container";
import { ButtonGroup } from "@mui/material";
import { ImportData } from "../../types/import-data";
import { isParse } from "typescript-json";
import { useSnackbar } from "notistack";

export const HeaderBar = () => {
  const inputFile = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const { inventorySlots, equipmentSlots } = useAppSelector(selectPreset);
  const { enqueueSnackbar } = useSnackbar();

  const exportData = useCallback(() => {
    const data = JSON.stringify(
      {
        inventorySlots,
        equipmentSlots,
      },
      null,
      2
    );

    exportAsJson("PRESET", data);
  }, [inventorySlots, equipmentSlots]);

  const importData = useCallback(() => {
    inputFile.current?.click();
  }, []);

  const onFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        enqueueSnackbar("Internal Server Error - Send your .json to nullopt#2057", { variant: "error" });
        return;
      }

      const data = isParse<ImportData>(event.target.result as string);
      if (!data) {
        // do something here
        enqueueSnackbar("Invalid JSON data.", { variant: "error" });
        return;
      }

      dispatch(importDataAction(data));
      enqueueSnackbar("Successfully imported your preset.", { variant: "success" });
    };

    reader.readAsText(event.target.files[0]);

    // Reset the file input so users can upload the same json
    event.target.value = "";
  }, []);

  return (
    <Box className="header-bar">
      <input
        type="file"
        id="file"
        ref={inputFile}
        style={{ display: "none" }}
        accept="application/JSON"
        onChange={onFileUpload}
      />
      <AppBar position="sticky">
        <Container className="app-bar">
          <Toolbar disableGutters className="tool-bar">
            <div className="image-container sub-item">
              <img
                width={80}
                height={80}
                src={"https://cdn.discordapp.com/icons/534508796639182860/a_59ac554a5e8e3104d19f8d6f09dba8d8.gif"}
              />
            </div>
            <Typography variant="h5" component="div" fontFamily="monospace" className="sub-item">
              PVME Preset Generator
            </Typography>
            <ButtonGroup className="button-container sub-item">
              <Button color="inherit" variant="outlined" onClick={importData}>
                Import JSON
              </Button>
              <Button color="inherit" variant="outlined" onClick={exportData}>
                Export JSON
              </Button>
            </ButtonGroup>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
};
