import { equipmentCoords, inventoryCoords } from "../../data/coordinates";
import { Coord } from "../../types/coord";
import { ItemData } from "../../types/inventory-slot";

import "./SlotSection.css";

interface SlotProps {
  slots: ItemData[];
  handleClickOpen: (event: React.MouseEvent<HTMLAreaElement>, index: number, className: string) => void;
}

interface SlotSectionProps extends SlotProps {
  coords: Coord[];
  className: string;
}

const SlotSection = ({ slots, handleClickOpen, coords, className }: SlotSectionProps) => {
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
              console.log("AREA ONCLICK: ", index);
              handleClickOpen(event, index, className);
            }}
          />
          {slots[index]?.image ? (
            <div
              className={`${className}-icon-container`}
              style={{
                top: coord.y1,
                left: coord.x1,
              }}
            >
              <img key={index} className={`${className}-icon`} src={slots[index].image} alt={slots[index].name} />
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
