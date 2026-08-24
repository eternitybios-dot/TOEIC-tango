import { rmSync } from "node:fs";

const dir = process.argv[2];
if (!dir) {
  console.error("usage: node scripts/clean.mjs <dir>");
  process.exit(1);
}
rmSync(dir, { recursive: true, force: true });
