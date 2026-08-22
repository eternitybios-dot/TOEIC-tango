import { copyFileSync, writeFileSync } from "node:fs";

// SPA fallback for GitHub Pages deep links.
copyFileSync("docs/index.html", "docs/404.html");
writeFileSync("docs/.nojekyll", "");
