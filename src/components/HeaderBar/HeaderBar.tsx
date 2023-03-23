import { useCallback, useRef } from "react";
import { useSnackbar } from "notistack";
import { validate } from "typescript-json";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { UploadPreset } from "./headerBarApi";

import {
  importDataAction,
  selectPreset,
} from "../../redux/store/reducers/preset-reducer";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { ImportData } from "../../types/import-data";
import { exportAsJson } from "../../utility/export-to-json";
import { sanitizedData, stringifyData } from "../../utility/sanitizer";

import "./HeaderBar.css";

export const HeaderBar = () => {
  const inputFile = useRef<HTMLInputElement>(null);

  const dispatch = useAppDispatch();
  const { presetName, inventorySlots, equipmentSlots } =
    useAppSelector(selectPreset);
  const { enqueueSnackbar } = useSnackbar();

  const generateShareableLink = async () => {
    try {
      const sanitized = sanitizedData(inventorySlots, equipmentSlots);
      const stringified = stringifyData(
        presetName,
        sanitized.inventory,
        sanitized.equipment
      );
      enqueueSnackbar("Generating shareable link...", { variant: "info" });
      const id = await UploadPreset(stringified);
      await navigator.clipboard.writeText(
        `https://pvme.github.io/preset-maker/${id}`
      );
      enqueueSnackbar(
        `https://pvme.github.io/preset-maker/${id} has been copied to your clipboard!`,
        { variant: "success" }
      );
    } catch (err) {
      enqueueSnackbar("Something went wrong, please try again.", {
        variant: "error",
      });
    }
  };

  const exportData = useCallback(() => {
    const sanitized = sanitizedData(inventorySlots, equipmentSlots);
    const stringified = stringifyData(
      presetName,
      sanitized.inventory,
      sanitized.equipment
    );
    exportAsJson(`PRESET_${presetName.replaceAll(" ", "_")}`, stringified);
  }, [presetName, inventorySlots, equipmentSlots]);

  const importData = useCallback(() => {
    inputFile.current?.click();
  }, []);

  const onFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (!event.target?.result) {
          enqueueSnackbar(
            "Internal Server Error - Send your .json to nullopt#2057",
            { variant: "error" }
          );
          return;
        }

        const data = JSON.parse(event.target.result as string);
        if (!validate<ImportData>(data).success) {
          enqueueSnackbar("Invalid JSON data.", { variant: "error" });
          return;
        }

        // import the json data into the preset editor
        dispatch(importDataAction(data));
        enqueueSnackbar("Successfully imported your preset.", {
          variant: "success",
        });
      };

      reader.readAsText(event.target.files[0]);

      // Reset the file input so users can upload the same json
      event.target.value = "";
    },
    []
  );

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
                src={
                  "https://cdn.discordapp.com/icons/534508796639182860/a_59ac554a5e8e3104d19f8d6f09dba8d8.gif"
                }
              />
            </div>
            <Typography
              variant="h5"
              component="div"
              fontFamily="monospace"
              className="sub-item"
            >
              PVME Preset Generator
            </Typography>
            <ButtonGroup className="button-container sub-item">
              <Button
                color="inherit"
                variant="outlined"
                onClick={generateShareableLink}
              >
                Get&nbsp;Shareable&nbsp;Link
              </Button>
              <Button color="inherit" variant="outlined" onClick={importData}>
                Import&nbsp;JSON
              </Button>
              <Button color="inherit" variant="outlined" onClick={exportData}>
                Export&nbsp;JSON
              </Button>
            </ButtonGroup>
          </Toolbar>
        </Container>
      </AppBar>
    </Box>
  );
};
