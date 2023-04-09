import { useCallback, useEffect, useRef, useState } from "react";
import { canCopyImagesToClipboard } from "copy-image-clipboard";
import { useSnackbar } from "notistack";

import Button from "@mui/material/Button";
import List from "@mui/material/List";

import { BreakdownHeader } from "../BreakdownHeader/BreakdownHeader";
import { BreakdownListItem } from "../BreakdownListItem/BreakdownListItem";
import { ClipboardCopyButtonContainer } from "../ClipboardCopyButtonContainer/ClipboardCopyButtonContainer";
import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";
import { ItemData } from "../../types/item-data";
import { BreakdownType } from "../../types/breakdown";
import {
  copyImageToClipboard,
  exportAsImage,
} from "../../utility/export-to-png";

import "./PresetBreakdown.css";

// This is used to map the equipmentSlots array (0-12) to a column
// Used in getMappedEquipment
const customOrder: number[] = [0, 4, 6, 7, 8, 2, 9, 1, 3, 5, 10, 11, 12];

export const PresetBreakdown = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const [mappedEquipment, setMappedEquipment] = useState<ItemData[]>();
  const [uniqueInventoryItems, setUniqueInventoryItems] =
    useState<ItemData[]>();

  const {
    presetName: name,
    inventorySlots,
    equipmentSlots,
  } = useAppSelector(selectPreset);

  useEffect(() => {
    const getMappedEquipment = () => {
      const reorderedArray: ItemData[] = [];

      for (let i = 0; i < customOrder.length; i++) {
        const orderIndex = customOrder[i];
        reorderedArray[i] = equipmentSlots[orderIndex];
      }

      setMappedEquipment(reorderedArray);
    };

    const getUniqueInventoryItems = () => {
      let uniqueItemData = inventorySlots.filter((item, index, self) => {
        return (
          self.map((i) => i.name).indexOf(item.name) === index && item.name
        );
      });

      setUniqueInventoryItems(uniqueItemData);
    };

    getMappedEquipment();
    getUniqueInventoryItems();
  }, [inventorySlots, equipmentSlots]);

  const exportBreakdown = useCallback(async () => {
    await exportAsImage(
      exportRef.current,
      `BREAK_DOWN_${name.replaceAll(" ", "_")}`


    );
  }, [name, exportRef]);

  const copyBreakdownToClipboard = useCallback(async () => {
    await copyImageToClipboard(exportRef.current, {
      onSuccess: () => {
        enqueueSnackbar("Copied image to clipboard", {
          variant: "success",
        });
      },
      onError: () => {
        enqueueSnackbar("Failed to copy image to clipboard", {
          variant: "error",
        });
      }
    });
  }, [exportRef]);

  return (
    <div className="breakdown-container">
      <div className="breakdown-header">
        <Button
          className="breakdown-button"
          variant="contained"
          color="success"
          onClick={exportBreakdown}
        >
          Save Breakdown as PNG
        </Button>
        <ClipboardCopyButtonContainer className="breakdown-button">
          <Button
            variant="outlined"
            color="secondary"
            disabled={!canCopyImagesToClipboard()}
            onClick={copyBreakdownToClipboard}
          >
            Copy Breakdown to Clipboard
          </Button>
        </ClipboardCopyButtonContainer>
      </div>
      <div className="breakdown-inner-container" ref={exportRef}>
        <div className="equipment-breakdown-container--equipment">
          <List className="breakdown-list" dense>
            <BreakdownHeader />
            {mappedEquipment?.map(
              (item) =>
                item.label && (
                  <BreakdownListItem
                    key={item.label}
                    item={item}
                    type={BreakdownType.Equipment}
                  />
                )
            )}
          </List>
        </div>
        <div className="equipment-breakdown-container--inventory">
          <List className="breakdown-list" dense>
            <BreakdownHeader />
            {uniqueInventoryItems &&
              uniqueInventoryItems.map((item) => {
                return (
                  <BreakdownListItem
                    key={item.label}
                    item={item}
                    type={BreakdownType.Inventory}
                  />
                );
              })}
          </List>
        </div>
      </div>
    </div>
  );
};
