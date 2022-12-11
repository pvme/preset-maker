import { PresetBreakdown } from "../PresetBreakdown/PresetBreakdown";
import { PresetEditor } from "../PresetEditor/PresetEditor";

import "./PresetSection.css";

export const PresetSection = () => {
  return (
    <div className="preset-section">
      <PresetEditor />
      <PresetBreakdown />
    </div>
  );
};
