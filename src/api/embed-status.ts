import axios from "axios";
import { FunctionURLs } from "./function-urls";
import { getDevHeaders } from "./get-headers";
import type { InventoryLayout } from "../hooks/useInventoryLayout";

export async function getEmbedStatus(id: string, layout: InventoryLayout, signal?: AbortSignal) {
  const { data } = await axios.get(`${FunctionURLs.getPreset}?id=${encodeURIComponent(id)}&embedStatus=${layout}`, {
    headers: getDevHeaders(), signal, timeout: 15000,
  });
  if (data?.state === "pending") return { state: "pending" as const };
  if (data?.state === "ready" && typeof data.revision === "string" && /^[a-f0-9]{64}$/.test(data.revision)) {
    return { state: "ready" as const, revision: data.revision };
  }
  throw new Error("Invalid embed status response");
}
