import { SLOT_METRICS, equipmentCoords } from "../../data/coordinates";
import { type Coord } from "../../schemas/coord";
import { type Item } from "../../schemas/item-data";
import sprite from "../../assets/presetmap_desktop.png";

// Reuse the original PvME artwork without baking a second layout into an image.
export function SlotBackground({ coords, group, slots }: {
  coords: Coord[];
  group: "inventory" | "equipment";
  slots: Item[];
}) {
  return <div className="preset-slots__background" aria-hidden="true">
    {coords.map((coord, index) => {
      const source = group === "equipment" && !slots[index]?.id
        ? equipmentCoords[index] : { x: 7, y: 7 };
      return <span key={index} style={{
        position: "absolute", left: coord.x, top: coord.y,
        ...SLOT_METRICS[group], backgroundImage: `url(${sprite})`,
        backgroundPosition: `-${source.x}px -${source.y}px`,
      }} />;
    })}
  </div>;
}
