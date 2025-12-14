import { z } from "zod";

export enum PrimaryOrAlternative {
  None,
  Primary,
  Alternative,
}

export interface IndexedSelection {
  primaryOrAlternative: PrimaryOrAlternative;
  index: number;
}
