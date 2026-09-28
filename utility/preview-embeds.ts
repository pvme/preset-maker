import { renderPresetImage } from "./embed-renderer";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { loadEmojis } from "../src/emoji/loadEmojis";
import { UI_TO_PRESET_SLOT } from "../src/components/PresetEditor/equipmentSlots";

const require = createRequire(import.meta.url);
const { normalizeLayout } = require("../embed-renderer/lib/layout.js");

async function demoPreset() {
  const maps = await loadEmojis();
  const entries = Object.values(maps.byId).filter(item => maps.getUrl(item.id));
  const slots = (type: string, count: number) => entries.filter(item => item.preset_type === type)
    .slice(0, count).map(({ id }) => ({ id }));
  const items = slots("item", 28);
  return {
    presetName: "Portrait embed preview",
    inventorySlots: items.length ? items : entries.slice(0, 28).map(({ id }) => ({ id })),
    equipmentSlots: Array.from({ length: 12 }, (_, index) => ({
      id: entries.find(item => item.preset_slot === UI_TO_PRESET_SLOT[index])?.id || "",
    })),
    relics: slots("relic", 3), familiar: slots("familiar", 1)[0],
    ammoSpells: slots("ability", 3), aspect: slots("aspect", 1)[0],
  };
}

export const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (req.method === "GET" && url.pathname === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(await readFile(new URL("./preview-embeds.html", import.meta.url)));
    }
    if (req.method === "GET" && url.pathname === "/demo.json") {
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(await demoPreset(), null, 2));
    }
    if (req.method === "POST" && url.pathname === "/render.png") {
      // A local browser can send JSON; other origins cannot post into this tool.
      const origin = req.headers.origin;
      if (origin && origin !== `http://${req.headers.host}`) {
        res.writeHead(403); return res.end("Origin not allowed");
      }
      let size = 0;
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) { res.writeHead(413); return res.end("Preset too large"); }
        chunks.push(chunk);
      }
      let preset;
      try { preset = JSON.parse(Buffer.concat(chunks).toString()); }
      catch { res.writeHead(400); return res.end("Invalid JSON"); }
      const buffer = await renderPresetImage(preset, normalizeLayout(url.searchParams.get("layout")));
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
      return res.end(buffer);
    }
    res.writeHead(404); res.end("Not found");
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(error instanceof Error ? error.message : "Rendering failed");
  }
});
server.listen(Number(process.env.EMBED_PREVIEW_PORT || 3001), "127.0.0.1", () => {
  console.log(`Embed preview: http://127.0.0.1:${(server.address() as any).port}`);
});
