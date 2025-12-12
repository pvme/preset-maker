// src/api/get-preset.ts

import axios from "axios";
import { type Preset } from "../schemas/preset";
import { normalizePreset } from "../redux/store/reducers/normalizePreset";

export async function getPreset(id: string): Promise<Preset> {
  const { data } = await axios.get(`/api/presets/${id}`);
  return normalizePreset(data);
}

