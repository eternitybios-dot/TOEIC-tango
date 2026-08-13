import { readFileSync, writeFileSync } from "node:fs";

const path = "docs/index.html";
const html = readFileSync(path, "utf8").replace(
  '<script type="module" crossorigin>',
  "<script>",
);
writeFileSync(path, html);
writeFileSync("docs/404.html", html);
