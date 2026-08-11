/* ============================================
   portfolio.js — Apple 风格作品集
   ============================================ */

(function () {
  "use strict";

  const featuredEl = document.getElementById("project-featured");
  const gridEl = document.getElementById("project-grid");

  const escapeHTML = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderEmpty = (target) => {
    if (!target) return;
    target.innerHTML = `<div class="empty">还没有作品。<br><span style="color:var(--text-tertiary);font-size:0.875rem">编辑 <code>data/projects/*.json</code> 添加</span></div>`;
  };

  const renderFeatured = (project) => {
    if (!featuredEl || !project) {
      if (featuredEl) featuredEl.innerHTML = "";
      return;
    }
    featuredEl.innerHTML = `
      <div class="project-feature reveal">
        <div class="project-feature-grid">
          <div class="project-feature-cover">
            <img loading="lazy" src="${escapeHTML(project.cover)}" alt="${escapeHTML(project.title)}">
          </div>
          <div>
            <div class="project-feature-tag">Featured · ${escapeHTML(project.year || "")}</div>
            <h2 class="project-feature-title">${escapeHTML(project.title)}</h2>
            <p class="project-feature-tagline">${escapeHTML(project.tagline || "")}</p>
            <p class="project-feature-desc">${escapeHTML(project.description || "")}</p>
            ${
              project.tags && project.tags.length
                ? `<div class="project-tags">${project.tags
                    .map((t) => `<span class="project-tag">${escapeHTML(t)}</span>`)
                    .join("")}</div>`
                : ""
            }
            ${
              project.github
                ? `<a class="btn btn-primary" href="${escapeHTML(
                    project.github
                  )}" target="_blank" rel="noopener">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.8 10.9.6.1.8-.2.8-.5v-1.7c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.5 4.5-1.5 7.8-5.8 7.8-10.9C23.5 5.7 18.3.5 12 .5z"/></svg>
                    在 GitHub 查看
                  </a>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  };

  const renderGrid = (projects) => {
    if (!gridEl) return;
    if (!projects.length) {
      gridEl.innerHTML = "";
      return;
    }
    gridEl.classList.add("reveal-stagger");
    gridEl.innerHTML = projects
      .map(
        (p) => `
      <a class="card project-card" href="${escapeHTML(p.github || "#")}" ${
          p.github ? 'target="_blank" rel="noopener"' : ""
        }>
        <div class="card-image">
          <img loading="lazy" src="${escapeHTML(p.cover)}" alt="${escapeHTML(p.title)}">
        </div>
        <div class="card-body">
          <span class="card-tag">${escapeHTML(p.year || "")}</span>
          <h3 class="card-title">${escapeHTML(p.title)}</h3>
          <p class="card-excerpt">${escapeHTML(p.tagline || "")}</p>
          ${
            p.tags && p.tags.length
              ? `<div class="project-tags" style="margin-bottom:0">${p.tags
                  .slice(0, 4)
                  .map(
                    (t) =>
                      `<span class="project-tag" style="font-size:0.7rem;padding:2px 8px">${escapeHTML(
                        t
                      )}</span>`
                  )
                  .join("")}</div>`
              : ""
          }
        </div>
      </a>
    `
      )
      .join("");
  };

  const init = async () => {
    if (!featuredEl && !gridEl) return;
    try {
      const projects = await window.DataLoader.loadAllProjects();
      if (!projects.length) {
        renderEmpty(featuredEl);
        renderEmpty(gridEl);
        return;
      }
      const featured = projects.find((p) => p.featured);
      renderFeatured(featured);
      renderGrid(projects.filter((p) => p !== featured));
      if (typeof window.__reveal === "function") window.__reveal();
    } catch (e) {
      const msg = `加载作品失败：${escapeHTML(e.message)}`;
      if (featuredEl) featuredEl.innerHTML = `<div class="empty">${msg}</div>`;
      if (gridEl) gridEl.innerHTML = `<div class="empty">${msg}</div>`;
    }
  };

  init();
})();
