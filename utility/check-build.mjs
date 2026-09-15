import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { runInNewContext } from "node:vm";
import { resolveObjectURL } from "node:buffer";
import ts from "typescript";
import { layoutScreenshot } from "../tests/layout-fixture.mjs";
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
    .some(item => item.textContent === "Import screenshot"), "The production menu must contain Import screenshot.");
  assert.deepEqual(errors, [], "Opening the production menu must not cause runtime errors.");
  console.log("Production app starts and the menu contains Import screenshot.");
} finally {
  dom.window.close();
}


const importerFile = (await readdir("dist/assets")).find(name => /^ImportImageDialog-.*\.js$/.test(name));
assert.ok(importerFile, "The production image importer must be bundled.");
const importer = await readFile(join("dist/assets", importerFile), "utf8");
const parsed = ts.createSourceFile(importerFile, importer, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let factory;
const visit = node => {
  if (factory) return;
  if (ts.isFunctionDeclaration(node) && node.getText(parsed).includes("Detection cancelled.")) factory = node.getText(parsed);
  else ts.forEachChild(node, visit);
};
visit(parsed);
assert.ok(factory, "The production importer must include the slot detector.");
const workers = [];
class TestWorker {
  stopped = false;
  constructor(url) { this.blob = resolveObjectURL(url); workers.push(this); }
  postMessage(pixels, transfer) {
    const data = structuredClone(pixels, { transfer });
    void this.blob.text().then(code => {
      if (this.stopped) return;
      const self = { postMessage: result => this.onmessage({ data: result }) };
      runInNewContext(code, { self });
      self.onmessage({ data });
    }).catch(error => this.onerror(error));
  }
  terminate() { this.stopped = true; }
}
const detector = runInNewContext(`(${factory})()`, { Worker: TestWorker, Blob, URL });
const { canvas } = layoutScreenshot({ swapped: true });
const pixels = () => ({ width: canvas.width, height: canvas.height,
  data: new Uint8ClampedArray(canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data) });
const result = await detector.detectAsync(pixels(), new AbortController().signal);
assert.equal(result.regions.length, 40, "The minified worker must detect slots without access to the application scope.");
assert.ok(workers[0].stopped, "Completed detection must release its worker.");
const cancellation = new AbortController();
const pending = detector.detectAsync(pixels(), cancellation.signal);
cancellation.abort();
await assert.rejects(pending);
assert.ok(workers[1].stopped, "Cancelled detection must stop its worker.");
console.log("Production slot detection worker runs and supports cancellation.");
