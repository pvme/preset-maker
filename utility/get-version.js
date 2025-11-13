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

const tag = run("git describe --tags --abbrev=0") ?? "v0.0.0";
const count = run(`git rev-list ${tag}..HEAD --count`) ?? "0";
const version = `${tag}.${count}`;

writeFileSync("./src/.version", version);

console.log(version);
