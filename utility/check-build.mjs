import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import { transformWithEsbuild } from "vite";

const html = await readFile("dist/index.html", "utf8");
const entry = html.match(/<script[^>]+src="([^"]+\.js)"/)?.[1];
assert.ok(entry, "The production page must load an application script.");
const bundle = await readFile(join("dist/assets", basename(entry)), "utf8");
const { code } = await transformWithEsbuild(bundle, "production.js", { format: "iife" });
const errors = [];
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", error => errors.push(error.detail?.stack || error.message));
virtualConsole.on("error", (...args) => errors.push(args.map(String).join(" ")));

const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
  url: "https://example.test/preset-maker/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
  virtualConsole,
  beforeParse(window) {
    window.matchMedia = query => ({
      matches: false, media: query,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
    });
    window.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
    window.fetch = async () => new Response(JSON.stringify({ categories: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  },
});

try {
  dom.window.eval(code);
  for (let attempt = 0; attempt < 50; attempt++) {
    if (errors.length || dom.window.document.querySelector(".preset-menu__menu-button")) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.deepEqual(errors, [], "The production app must start without runtime errors.");
  const menu = dom.window.document.querySelector(".preset-menu__menu-button");
  assert.ok(menu, "The production app must render its preset menu.");
  menu.click();
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.ok([...dom.window.document.querySelectorAll('[role="menuitem"]')]
    .some(item => item.textContent === "Import Image"), "The production menu must contain Import Image.");
  assert.deepEqual(errors, [], "Opening the production menu must not cause runtime errors.");
  console.log("Production app starts and the menu contains Import Image.");
} finally {
  dom.window.close();
}
