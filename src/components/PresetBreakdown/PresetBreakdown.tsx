import { useCallback, useEffect, useRef, useState } from "react";

import { Button, CardActions } from "@mui/material";
import List from "@mui/material/List";

import { useAppSelector } from "../../redux/hooks";
import { selectPreset } from "../../redux/store/reducers/preset-reducer";
import { ItemData } from "../../types/inventory-slot";
import { BreakdownHeader } from "../BreakdownHeader/BreakdownHeader";
import { BreakdownListItem } from "../BreakdownListItem/BreakdownListItem";
import { copyImageToClipboard, exportAsImage } from "../../utility/export-to-png";

import "./PresetBreakdown.css";

// This is used to map the equipmentSlots array (0-12) to a column
// Used in getMappedEquipment
const customOrder: number[] = [0, 4, 6, 7, 8, 2, 9, 1, 3, 5, 10, 11, 12];

const maxLength = 14;

export const PresetBreakdown = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [mappedEquipment, setMappedEquipment] = useState<ItemData[]>();
  const [uniqueInventoryItems, setUniqueInventoryItems] = useState<ItemData[][]>();

  const { presetName: name, inventorySlots, equipmentSlots } = useAppSelector(selectPreset);

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
        return self.map((i) => i.name).indexOf(item.name) === index && item.name;
      });

      const splItemArray = uniqueItemData.map((_item, index) => {
        // Calculate the start and end indices of the subarray
        const startIndex = index * maxLength;
        const endIndex = startIndex + maxLength;

        // Return the subarray
        return uniqueItemData.slice(startIndex, endIndex);
      });

      setUniqueInventoryItems(splItemArray);
    };

    getMappedEquipment();
    getUniqueInventoryItems();
  }, [inventorySlots, equipmentSlots]);

  const exportBreakdown = useCallback(async () => {
    await exportAsImage(exportRef.current, `BREAK_DOWN_${name.replaceAll(" ", "_")}`);
  }, [name, exportRef]);

  const copyBreakdownToClipboard = useCallback(async () => {
    await copyImageToClipboard(exportRef.current);
  }, [exportRef]);

  return (
    <div className="breakdown-container">
      <div className="breakdown-header">
          <Button className="breakdown-button" variant="contained" color="success" onClick={exportBreakdown}>
            Save Breakdown as PNG
          </Button>
          <Button className="breakdown-button" variant="outlined" color="secondary" onClick={copyBreakdownToClipboard}>
            Copy Breakdown to Clipboard
          </Button>
      </div>
      <div className="breakdown-inner-container" ref={exportRef}>
        <div className="equipment-breakdown-container">
          <List className="breakdown-list" dense>
            <BreakdownHeader />
            {mappedEquipment?.map((item) => item.label && <BreakdownListItem key={item.label} item={item} />)}
          </List>
        </div>
        {uniqueInventoryItems?.map(
          (array, index) =>
            array.length > 0 && (
              <div key={index} className="equipment-breakdown-container">
                <List className="breakdown-list" dense>
                  <BreakdownHeader />
                  {array?.map((item) => {
                    return <BreakdownListItem key={item.label} item={item} />;
                  })}
                </List>
              </div>
            )
        )}
      </div>
    </div>
  );
};
