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

/* Pull the "Frequently Asked Questions" block out of the markdown so the page can
   emit FAQPage structured data from the same source the reader sees. Questions are
   the h3s under that h2; the answer is the prose beneath each, up to the next
   heading. Code fences and diagrams inside an answer are skipped — schema.org
   wants the plain answer text, not the markup. */
function faqEntries(raw) {
  const lines = raw.split("\n");
  let i = lines.findIndex((l) =>
    /^##\s+(faq|frequently asked questions)\b/i.test(l.trim())
  );
  if (i < 0) return [];

  const strip = (s) =>
    s
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\s+/g, " ")
      .trim();

  const out = [];
  let current = null;
  let inFence = false;
  let inSvg = false;

  for (i += 1; i < lines.length; i += 1) {
    const line = lines[i];
    const t = line.trim();
    if (t.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^<svg\b/i.test(t)) inSvg = true;
    if (inSvg) {
      if (/<\/svg>/i.test(t)) inSvg = false;
      continue;
    }
    if (/^##\s/.test(t)) break; // next section ends the FAQ
    const q = t.match(/^###\s+(.*\S)\s*$/);
    if (q) {
      if (current && current.answer) out.push(current);
      current = { question: strip(q[1]), answer: "" };
      continue;
    }
    if (!current || !t) continue;
    current.answer += (current.answer ? " " : "") + strip(t.replace(/^[-*]\s+/, ""));
  }
  if (current && current.answer) out.push(current);
  return out;
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
    faq: (data) => faqEntries(read(data.page.inputPath)),
  },
};
