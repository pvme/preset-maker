// utility/get-version.js

import { execSync } from "child_process";

function run(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return null;
  }
}

// Get last tag (e.g. "v1.4.0")
const tag = run("git describe --tags --abbrev=0") ?? "v0.0.0";

// Count commits since that tag (e.g. "12")
const count = run(`git rev-list ${tag}..HEAD --count`) ?? "0";

// Final pretty version: v1.4.0.12
const version = `${tag}.${count}`;

console.log(version);   // IMPORTANT: output ONLY the version
