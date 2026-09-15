import type { Pixels, Region } from "./matcher";

export interface Detection {
  regions: Region[];
  inventory: boolean;
  equipment: boolean;
}

export function createPresetLayoutDetector(): {
  detect(pixels: Pixels): Detection;
  detectAsync(pixels: Pixels, signal?: AbortSignal): Promise<Detection>;
};
