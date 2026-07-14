import fs from "node:fs";

const cache = new Map();

function read(inputPath) {
  if (cache.has(inputPath)) return cache.get(inputPath);
  let raw = "";
  try {
    raw = fs.readFileSync(inputPath, "utf8");
  } catch {
    raw = "";
  }
  cache.set(inputPath, raw);
  return raw;
}

function firstHeading(raw) {
  const m = raw.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : "Untitled";
}

function metaDescription(raw) {
  const lines = raw.split("\n");
  let inFence = false;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!t) continue;
    if (t.startsWith("#")) continue;
    if (t.startsWith("|") || t.startsWith(">") || /^[-*\d]/.test(t)) continue;
    // First real paragraph -> strip light markdown to plain text.
    let s = t
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links -> text
      .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
      .replace(/\*([^*]+)\*/g, "$1") // italics
      .replace(/`([^`]+)`/g, "$1") // inline code
      .replace(/[\\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (s.length > 157) s = s.slice(0, 157).replace(/\s+\S*$/, "") + "…";
    return s;
  }
  return "";
}

export default {
  layout: "content.njk",
  tags: ["content"],
  eleventyComputed: {
    // /content/<...>/index.md -> /<...>/  (drop the content/ prefix)
    permalink: (data) =>
      data.page.filePathStem.replace(/^\/content/, "") + ".html",
    title: (data) => firstHeading(read(data.page.inputPath)),
    description: (data) => metaDescription(read(data.page.inputPath)),
    hasMath: (data) => {
      const raw = read(data.page.inputPath);
      return /\\\(|\\\[|\$\$/.test(raw);
    },
    hasMermaid: (data) => /```mermaid/.test(read(data.page.inputPath)),
  },
};
