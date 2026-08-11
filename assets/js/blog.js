/* ============================================
   blog.js — 博客列表 + 分类筛选
   ============================================ */

(function () {
  "use strict";

  const listEl = document.getElementById("post-list");
  const tabsEl = document.getElementById("filter-tabs");
  if (!listEl) return;

  const state = { posts: [], categories: [], active: "all" };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  };

  const escapeHTML = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const renderTabs = () => {
    const all = `<button class="filter-tab active" data-cat="all">全部</button>`;
    const cats = state.categories
      .map(
        (c) =>
          `<button class="filter-tab" data-cat="${escapeHTML(c.slug)}">${escapeHTML(
            c.name
          )}</button>`
      )
      .join("");
    tabsEl.innerHTML = all + cats;

    tabsEl.querySelectorAll(".filter-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        state.active = tab.dataset.cat;
        tabsEl
          .querySelectorAll(".filter-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderList();
      });
    });
  };

  const renderList = () => {
    const filtered =
      state.active === "all"
        ? state.posts
        : state.posts.filter((p) => p.category === state.active);

    if (!filtered.length) {
      listEl.innerHTML = `<div class="empty" style="grid-column: 1/-1">该分类下还没有文章。</div>`;
      return;
    }

    listEl.classList.add("reveal-stagger");
    listEl.innerHTML = filtered
      .map(
        (p) => `
        <a class="card" href="post.html?slug=${encodeURIComponent(p.slug)}">
          ${p.cover ? `<div class="card-image"><img loading="lazy" src="${escapeHTML(
            p.cover
          )}" alt="${escapeHTML(p.title)}"></div>` : ""}
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
  };

  const init = async () => {
    try {
      const data = await window.DataLoader.loadAllPosts();
      state.posts = data.posts;
      state.categories = data.categories;
      renderTabs();
      renderList();

      // 允许深链 ?category=xxx
      const params = new URLSearchParams(location.search);
      const c = params.get("category");
      if (c) {
        const tab = tabsEl.querySelector(`[data-cat="${c}"]`);
        if (tab) tab.click();
      }
    } catch (e) {
      listEl.innerHTML = `<div class="empty" style="grid-column: 1/-1">加载文章失败：${escapeHTML(
        e.message
      )}</div>`;
    }
  };

  init();
})();
