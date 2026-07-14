import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import anchor from "markdown-it-anchor";
import taskLists from "markdown-it-task-lists";
import texmath from "markdown-it-texmath";
import katex from "katex";

export default function (eleventyConfig) {
  // --- Passthrough static assets --------------------------------------------
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/root": "." }); // favicon.ico, robots-static, etc.
  // Self-hosted vendor libs (no external CDNs -> fully offline-capable PWA)
  eleventyConfig.addPassthroughCopy({ "node_modules/katex/dist": "assets/vendor/katex" });
  eleventyConfig.addPassthroughCopy({ "node_modules/mermaid/dist": "assets/vendor/mermaid" });

  // --- Plugins ---------------------------------------------------------------
  // tabindex="0" makes horizontally-scrollable code blocks keyboard-accessible
  // (WCAG scrollable-region-focusable).
  eleventyConfig.addPlugin(syntaxHighlight, {
    preAttributes: { tabindex: 0 },
  });

  // --- Markdown configuration ------------------------------------------------
  eleventyConfig.amendLibrary("md", (md) => {
    md.set({ html: true, linkify: false, typographer: true });

    // Header anchors with a subtle hover symbol; ids enable in-page links.
    // Clean ASCII slugs (no percent-encoding) so heading ids and the in-page
    // permalink hrefs stay byte-identical and survive URL decoding — headings
    // containing punctuation (& , : / — ’) otherwise produce %-escaped ids.
    const slugify = (s) =>
      String(s)
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    md.use(anchor, {
      slugify,
      permalink: anchor.permalink.linkInsideHeader({
        symbol: "#",
        placement: "after",
        class: "header-anchor",
        ariaHidden: true,
        // aria-hidden links must not be focusable (WCAG aria-hidden-focus).
        renderAttrs: () => ({ tabindex: "-1" }),
      }),
      tabIndex: false,
    });

    // GitHub-style task lists: real, toggleable checkboxes.
    md.use(taskLists, { enabled: true, label: true });

    // Build-time math. Content uses \( … \) inline and \[ … \] display
    // ("brackets"); rendering here (before the escape rule) keeps the
    // delimiters intact and emits static, search-indexable KaTeX HTML.
    md.use(texmath, {
      engine: katex,
      delimiters: "brackets",
      katexOptions: { throwOnError: false, output: "html" },
    });

    // Wrap tables so they scroll horizontally on small screens.
    const defaultTableOpen =
      md.renderer.rules.table_open ||
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    // tabindex="0" makes a horizontally-scrollable table keyboard-accessible
    // (WCAG scrollable-region-focusable), mirroring the code-block treatment.
    md.renderer.rules.table_open = (tokens, idx, options, env, self) =>
      '<div class="table-wrap" tabindex="0">' +
      defaultTableOpen(tokens, idx, options, env, self);
    const defaultTableClose =
      md.renderer.rules.table_close ||
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.table_close = (tokens, idx, options, env, self) =>
      defaultTableClose(tokens, idx, options, env, self) + "</div>";

    // ```mermaid fences become diagram containers, bypassing Prism so Mermaid
    // can render them client-side. Wraps whatever fence renderer is active.
    const baseFence =
      md.renderer.rules.fence ||
      ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
    md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const info = (tokens[idx].info || "").trim().split(/\s+/)[0].toLowerCase();
      if (info === "mermaid") {
        return `<div class="mermaid">${md.utils.escapeHtml(tokens[idx].content)}</div>\n`;
      }
      return baseFence(tokens, idx, options, env, self);
    };
  });

  // --- Collections -----------------------------------------------------------
  // All rendered content pages, sorted by URL for stable nav/sitemap order.
  eleventyConfig.addCollection("content", (api) =>
    api
      .getFilteredByTag("content")
      .sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0))
  );

  // --- Filters ---------------------------------------------------------------
  eleventyConfig.addFilter("depth", (url) =>
    String(url).split("/").filter(Boolean).length
  );

  // Ancestor URLs of a page url, e.g. /a/b/c/ -> ['/a/','/a/b/'] (excludes self).
  eleventyConfig.addFilter("ancestors", (url) => {
    const segs = String(url).split("/").filter(Boolean);
    const out = [];
    let acc = "";
    for (let i = 0; i < segs.length - 1; i++) {
      acc += "/" + segs[i];
      out.push(acc + "/");
    }
    return out;
  });

  // Direct children of a url within a list of pages.
  eleventyConfig.addFilter("childrenOf", (pages, url) => {
    const base = String(url);
    const baseDepth = base.split("/").filter(Boolean).length;
    return pages.filter((p) => {
      const u = p.url;
      return (
        u !== base &&
        u.startsWith(base) &&
        u.split("/").filter(Boolean).length === baseDepth + 1
      );
    });
  });

  // Look up a page in a list by its url.
  eleventyConfig.addFilter("byUrl", (pages, url) =>
    pages.find((p) => p.url === url)
  );

  eleventyConfig.addFilter("startsWith", (s, p) => String(s).startsWith(p));

  // Slug = first path segment of a url, e.g. /a/b/ -> 'a'.
  eleventyConfig.addFilter("topSlug", (url) =>
    String(url).split("/").filter(Boolean)[0] || ""
  );

  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toISOString().slice(0, 10)
  );

  // --- Ignores ---------------------------------------------------------------
  eleventyConfig.ignores.add("BUILD_CHECKLIST.md");
  eleventyConfig.ignores.add("site_description_and_requirements.md");
  eleventyConfig.ignores.add("README.md");
  eleventyConfig.ignores.add("CLAUDE.md");
  eleventyConfig.ignores.add("_plan/PHASE_PLAN.md");

  return {
    dir: {
      input: ".",
      includes: "src/_includes",
      data: "src/_data",
      output: "_site",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "11ty.js"],
  };
}
