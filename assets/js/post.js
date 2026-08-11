/* ============================================
   post.js — 文章详情（Markdown 渲染）
   ============================================ */

(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const setText = (id, text) => {
    const el = $(id);
    if (el) el.textContent = text;
  };
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

  const renderError = (msg) => {
    const c = $("post-content");
    if (c) c.innerHTML = `<div class="empty">${escapeHTML(msg)}</div>`;
    setText("post-title", "未找到文章");
  };

  const applyPost = (post, md) => {
    document.title = `${post.title} · Brian`;
    setText("post-category", post.categoryName || post.category);
    setText("post-title", post.title);
    setText("post-date", formatDate(post.date));

    if (post.cover) {
      const cover = $("post-cover");
      const img = $("post-cover-img");
      if (cover) cover.style.display = "";
      if (img) {
        img.src = post.cover;
        img.alt = post.title;
      }
    }

    const html = marked.parse(md);
    $("post-content").innerHTML = html;

    // 外链新窗口打开
    $("post-content").querySelectorAll("a[href^='http']").forEach((a) => {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
    });

    // 标题锚点
    $("post-content").querySelectorAll("h1, h2, h3, h4").forEach((h) => {
      const id = h.textContent
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
        .replace(/^-|-$/g, "");
      if (id) h.id = id;
    });

    // 代码高亮
    $("post-content").querySelectorAll("pre code").forEach((block) => {
      try { hljs.highlightElement(block); } catch (e) {}
    });

    if (post.tags && post.tags.length) {
      const tagsEl = $("post-tags");
      if (tagsEl) {
        tagsEl.innerHTML = post.tags
          .map((t) => `<span class="project-tag">${escapeHTML(t)}</span>`)
          .join("");
      }
    }
  };

  const init = async () => {
    const params = new URLSearchParams(location.search);
    const slug = params.get("slug");
    if (!slug) return renderError("缺少文章 slug 参数。");

    try {
      const post = await window.DataLoader.loadPost(slug);
      if (!post) return renderError(`未找到 slug 为 "${slug}" 的文章。`);

      if (!post.file) {
        return renderError(`文章 "${slug}" 缺少 file 字段。`);
      }

      // 单独 fetch 文章 markdown 文件，带超时
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(post.file, { cache: "no-cache", signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`无法加载 ${post.file} (HTTP ${res.status})`);

      let md = await res.text();
      // 剥离 YAML frontmatter
      md = md.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");

      if (typeof marked === "undefined") {
        return renderError("marked.js 未加载，请检查网络。");
      }

      applyPost(post, md);
    } catch (e) {
      renderError(`加载失败：${e.message}`);
    }
  };

  init();
})();
