import type { Box, Region, Group } from "./matcher";
export interface Panel { box: Box | null; enabled: boolean; columns: number; rows: number; gap: number }
export interface ManualLayout { step: Group; inventory: Panel; equipment: Panel & { kind: 'worn' | 'grid'; overrides: Record<number, Box> } }
export function createPresetManualLayout(): {
  blank(): ManualLayout;
  regions(state: ManualLayout): Region[];
  ready(state: ManualLayout): boolean;
  grid(state: ManualLayout, field: 'columns' | 'rows' | 'gap', value: number): ManualLayout;
  place(state: ManualLayout, box: Box, width: number, height: number): ManualLayout;
  move(state: ManualLayout, index: number, box: Box, width: number, height: number): ManualLayout;
  clamp(box: Box, width: number, height: number): Box;
};
