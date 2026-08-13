import { readFileSync, writeFileSync } from "node:fs";

const path = "docs/index.html";
let html = readFileSync(path, "utf8").replace(
  '<script type="module" crossorigin>',
  "<script>",
);

const scriptMatch = html.match(/<script>[\s\S]*?<\/script>/);
if (!scriptMatch) {
  throw new Error("bundled script tag not found");
}

html = html.replace(scriptMatch[0], "");
html = html.replace("</body>", `    ${scriptMatch[0]}\n  </body>`);

writeFileSync(path, html);
writeFileSync("docs/404.html", html);
