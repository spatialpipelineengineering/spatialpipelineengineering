/* Spatial Pipeline Engineering — progressive enhancement.
   No external dependencies; vendor libs (KaTeX, Mermaid) are self-hosted. */
(function () {
  "use strict";

  const ICON_COPY =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  const ICON_CHECK =
    '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ---------------------------- Mobile nav ----------------------------- */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("primary-nav");
    if (!toggle || !nav) return;

    const close = () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });
  }

  /* --------------------------- Copy buttons ---------------------------- */
  function initCopyButtons() {
    const blocks = document.querySelectorAll(".prose pre");
    blocks.forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;
      if (code.classList.contains("language-mermaid")) return; // handled by mermaid

      const wrap = document.createElement("div");
      wrap.className = "code-block";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.innerHTML = ICON_COPY + "<span>Copy</span>";
      wrap.appendChild(btn);

      btn.addEventListener("click", async () => {
        const text = code.innerText;
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand("copy");
          } catch {}
          document.body.removeChild(ta);
        }
        btn.classList.add("is-copied");
        btn.innerHTML = ICON_CHECK + "<span>Copied</span>";
        setTimeout(() => {
          btn.classList.remove("is-copied");
          btn.innerHTML = ICON_COPY + "<span>Copy</span>";
        }, 1800);
      });
    });
  }

  /* ----------------------- Task list line-through ---------------------- */
  function initTaskLists() {
    const boxes = document.querySelectorAll(".task-list-item-checkbox");
    boxes.forEach((box) => {
      box.disabled = false;
      const item = box.closest(".task-list-item");
      const sync = () => item && item.classList.toggle("is-checked", box.checked);
      sync();
      box.addEventListener("change", sync);
    });
  }

  /* ----------------------------- Mermaid ------------------------------- */
  function initMermaid() {
    if (!document.body.dataset.mermaid) return;
    // Normalize ```mermaid fences (rendered as <pre><code class="language-mermaid">)
    document.querySelectorAll("pre > code.language-mermaid, pre.language-mermaid").forEach((node) => {
      const pre = node.tagName === "PRE" ? node : node.parentElement;
      const div = document.createElement("div");
      div.className = "mermaid";
      div.textContent = node.innerText;
      pre.replaceWith(div);
    });
    const diagrams = document.querySelectorAll(".mermaid");
    if (!diagrams.length) return;

    import("/assets/vendor/mermaid/mermaid.esm.min.mjs")
      .then((mod) => {
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          flowchart: { useMaxWidth: false, htmlLabels: true, curve: "basis", padding: 14 },
          sequence: { useMaxWidth: false },
          themeVariables: {
            fontSize: "15px",
            primaryColor: "#e7f1ec",
            primaryBorderColor: "#0f6e63",
            primaryTextColor: "#16302a",
            lineColor: "#11839e",
            secondaryColor: "#eef3f0",
            tertiaryColor: "#ffffff",
            clusterBkg: "#f4f7f5",
            clusterBorder: "#cfe0d8",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          },
        });
        mermaid.run({ nodes: diagrams });
      })
      .catch(() => {});
  }

  /* --------------------- FAQ sections -> accordions -------------------- */
  function initFaqAccordions() {
    const prose = document.querySelector(".prose");
    if (!prose) return;
    const heads = prose.querySelectorAll("h2, h3");
    heads.forEach((head) => {
      const text = head.textContent.replace(/[#]+$/, "").trim();
      if (!/^(faq|frequently asked questions)\b/i.test(text)) return;

      const level = parseInt(head.tagName.substring(1), 10);
      const qLevel = "H" + (level + 1);
      const stop = (el) =>
        el && /^H[1-6]$/.test(el.tagName) && parseInt(el.tagName[1], 10) <= level;

      const container = document.createElement("div");
      container.className = "faq-accordion";

      let node = head.nextElementSibling;
      const toRemove = [];
      let current = null;

      while (node && !stop(node)) {
        const next = node.nextElementSibling;
        if (node.tagName === qLevel) {
          current = document.createElement("details");
          current.className = "faq-item";
          const summary = document.createElement("summary");
          summary.innerHTML = node.innerHTML.replace(
            /<a class="header-anchor"[^>]*>.*?<\/a>/,
            ""
          );
          const body = document.createElement("div");
          body.className = "faq-item__body";
          current.appendChild(summary);
          current.appendChild(body);
          container.appendChild(current);
          toRemove.push(node);
        } else if (current) {
          current.querySelector(".faq-item__body").appendChild(node);
        } else {
          // intro text between the FAQ heading and first question stays put
        }
        node = next;
      }
      toRemove.forEach((n) => n.remove());
      if (container.children.length) head.after(container);
    });
  }

  /* ---------------------- On-this-page TOC + scroll-spy ---------------- */
  function initToc() {
    const aside = document.querySelector(".article-layout aside");
    if (!aside) return;
    const heads = Array.from(document.querySelectorAll(".prose h2[id]"));
    if (heads.length < 3) return;

    const nav = document.createElement("nav");
    nav.className = "related toc";
    nav.setAttribute("aria-label", "On this page");
    const heading = document.createElement("h2");
    heading.textContent = "On this page";
    const ul = document.createElement("ul");
    const links = new Map();

    heads.forEach((head) => {
      const clone = head.cloneNode(true);
      const sym = clone.querySelector(".header-anchor");
      if (sym) sym.remove();
      const a = document.createElement("a");
      a.href = "#" + head.id;
      a.textContent = clone.textContent.trim();
      const li = document.createElement("li");
      li.appendChild(a);
      ul.appendChild(li);
      links.set(head.id, a);
    });
    nav.append(heading, ul);
    aside.insertBefore(nav, aside.firstChild);

    if (!("IntersectionObserver" in window)) return;
    let active = null;
    const setActive = (id) => {
      const a = links.get(id);
      if (!a || a === active) return;
      if (active) active.classList.remove("is-active");
      a.classList.add("is-active");
      active = a;
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -65% 0px", threshold: 0 }
    );
    heads.forEach((h) => observer.observe(h));
  }

  /* -------------------------- Service worker --------------------------- */
  function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(() => {
    initNav();
    initCopyButtons();
    initTaskLists();
    initFaqAccordions();
    initToc();
    initMermaid();
    initServiceWorker();
  });
})();
