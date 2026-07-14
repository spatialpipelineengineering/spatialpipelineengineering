// Build-time cache-busting version for local CSS/JS.
// Hash of the site's own template-referenced assets so a redeploy changes the
// `?v=` query and defeats stale service-worker / browser caches.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Local CSS/JS referenced by the base template (root-relative to the project).
const FILES = [
  "../assets/css/style.css",
  "../assets/js/app.js",
];

export default (() => {
  try {
    const hash = createHash("sha1");
    for (const rel of FILES) {
      hash.update(readFileSync(resolve(__dirname, rel)));
    }
    return { v: hash.digest("hex").slice(0, 10) };
  } catch {
    return { v: "dev" };
  }
})();
