import { PresetBreakdown } from "../PresetBreakdown/PresetBreakdown";
import { PresetEditor } from "../PresetEditor/PresetEditor";
import { PresetName } from "../PresetLoader/PresetLoader";

import "./PresetSection.css";

export const PresetSection = () => {
  return (
    <div className="preset-section">
      <PresetName />
      <PresetEditor />
      <PresetBreakdown />
    </div>
  );
};
