// src/api/get-preset.ts

import axios from "axios";
import { type Preset } from "../schemas/preset";
import { normalizePreset } from "../redux/store/reducers/normalizePreset";
import { getDevHeaders } from "./get-headers";
import { FunctionURLs } from "./function-urls";

export async function getPreset(id: string): Promise<Preset> {
  const { data } = await axios.get(
    `${FunctionURLs.getPreset}?id=${encodeURIComponent(id)}`,
    { headers: getDevHeaders() }
  );

  return normalizePreset(data);
}
