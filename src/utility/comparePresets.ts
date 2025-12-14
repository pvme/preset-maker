// src/utility/comparePresets.ts

export function presetsAreEqual(a: any, b: any): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}
