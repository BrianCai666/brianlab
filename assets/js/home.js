/* ============================================
   home.js — 首页：最新文章 + 精选作品
   ============================================ */

(function () {
  "use strict";

  const escapeHTML = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  };

  const renderPosts = async () => {
    const el = document.getElementById("home-posts");
    if (!el) return;
    try {
      const { posts } = await window.DataLoader.loadAllPosts();
      if (!posts.length) {
        el.innerHTML = `<div class="empty">还没有文章。<a href="blog.html" style="color:var(--accent)">看看博客 →</a></div>`;
        return;
      }
      const latest = posts.slice(0, 3);
      el.classList.add("reveal-stagger");
      el.innerHTML = latest
        .map(
          (p) => `
        <a class="card" href="post.html?slug=${encodeURIComponent(p.slug)}">
          ${p.cover ? `<div class="card-image"><img loading="lazy" src="${escapeHTML(p.cover)}" alt="${escapeHTML(p.title)}"></div>` : ""}
          <div class="card-body">
            <span class="card-tag">${escapeHTML(p.categoryName || p.category)}</span>
            <h3 class="card-title">${escapeHTML(p.title)}</h3>
            <p class="card-excerpt">${escapeHTML(p.excerpt || "")}</p>
            <div class="card-meta">
              <span>${formatDate(p.date)}</span>
            </div>
          </div>
        </a>
      `
        )
        .join("");
      if (typeof window.__reveal === "function") window.__reveal();
    } catch (e) {
      el.innerHTML = `<div class="empty">文章加载失败：${escapeHTML(e.message)}</div>`;
    }
  };

  const renderProjects = async () => {
    const el = document.getElementById("home-projects");
    if (!el) return;
    try {
      const projects = await window.DataLoader.loadAllProjects();
      if (!projects.length) {
        el.innerHTML = `<div class="empty">还没有作品。<a href="portfolio.html" style="color:var(--accent)">看看作品集 →</a></div>`;
        return;
      }
      const top = projects.slice(0, 3);
      el.classList.add("reveal-stagger");
      el.innerHTML = `<div class="grid grid-3" style="margin-top:0">
        ${top
          .map(
            (p) => `
          <a class="card" href="${escapeHTML(p.github || "#")}" ${p.github ? 'target="_blank" rel="noopener"' : ""}>
            <div class="card-image">
              <img loading="lazy" src="${escapeHTML(p.cover)}" alt="${escapeHTML(p.title)}">
            </div>
            <div class="card-body">
              <span class="card-tag">${escapeHTML(p.year || "")}</span>
              <h3 class="card-title">${escapeHTML(p.title)}</h3>
              <p class="card-excerpt">${escapeHTML(p.tagline || "")}</p>
            </div>
          </a>
        `
          )
          .join("")}
      </div>`;
      if (typeof window.__reveal === "function") window.__reveal();
    } catch (e) {
      el.innerHTML = `<div class="empty">作品加载失败：${escapeHTML(e.message)}</div>`;
    }
  };

  renderPosts();
  renderProjects();
})();
