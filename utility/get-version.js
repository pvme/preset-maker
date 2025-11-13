// utility/get-version.js

import { execSync } from "child_process";
import { writeFileSync } from "fs";

function run(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return null;
  }
}

// Get last tag (e.g. "v1.4.0")
const tag = run("git describe --tags --abbrev=0") ?? "v0.0.0";

// Count commits since the tag
const count = run(`git rev-list ${tag}..HEAD --count`) ?? "0";

// Final pretty version: v1.4.0.12
const version = `${tag}.${count}`;

// Write into Vite's source tree so frontend can import it
writeFileSync("./src/version.txt", version);

console.log("Generated version:", version);
