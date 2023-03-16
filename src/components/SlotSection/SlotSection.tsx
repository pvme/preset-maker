import { equipmentCoords, inventoryCoords } from "../../data/coordinates";
import { Coord } from "../../types/coord";
import { ItemData } from "../../types/inventory-slot";

import "./SlotSection.css";

interface SlotProps {
  slots: ItemData[];
  handleClickOpen: (event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => void;
  handleShiftClick?: (event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => void;
}

interface SlotSectionProps extends SlotProps {
  coords: Coord[];
  className: string;
}

const SlotSection = ({ slots, handleClickOpen, handleShiftClick, coords, className }: SlotSectionProps) => {
  const getClassName = (slot: ItemData) => {
    const selectedClass = slot.selected ? `${className}-icon-container--selected` : '';
    return `${className}-icon-container ${selectedClass}`;
  }

  return (
    <div>
      {coords.map((coord: Coord, index: number) => (
        <div key={index + new Date().getTime()} style={{ position: "relative" }}>
          <area
            key={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            style={{ cursor: "pointer" }}
            shape="rect"
            coords={`${coord.x1},${coord.y1},${coord.x2},${coord.y2}`}
            onClick={(event: React.MouseEvent<HTMLAreaElement>) => {
              if (event.shiftKey && handleShiftClick) {
                handleShiftClick(event, index, className);
                return;
              }

              handleClickOpen(event, index, className);
            }}
          />
          {slots[index]?.image || slots[index]?.selected ? (
            <div
              className={getClassName(slots[index])}
              style={{
                top: coord.y1,
                left: coord.x1,
              }}
            >
              {slots[index]?.image ? 
                <img key={index} className={`${className}-icon`} src={slots[index].image} alt={slots[index].name} />
                : null
              }                
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export const Inventory = (props: SlotProps) => {
  return <SlotSection {...props} coords={inventoryCoords} className="inventory" />;
};

export const Equipment = (props: SlotProps) => {
  return <SlotSection {...props} coords={equipmentCoords} className="equipment" />;
};
