// utility/get-version.js

import { writeFileSync, readFileSync } from "fs";

function getPackageVersion() {
  try {
    const pkg = JSON.parse(readFileSync("./package.json", "utf8"));
    return String(pkg.version || "0");
  } catch {
    return "0";
  }
}

const majorVersion = getPackageVersion();
const runNumber = process.env.GITHUB_RUN_NUMBER ?? "0";
const version = `v${majorVersion}.${runNumber}`;

writeFileSync("./src/version.txt", `${version}\n`);

console.log("Generated version:", version);
