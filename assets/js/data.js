/* ============================================
   data.js — 共享数据加载器
   ------------------------------------------------------------
   特性：
   - Promise.allSettled：单个文件失败不影响其他
   - 每个请求带超时，避免页面卡死
   - 单文件缓存（同一会话内不重复请求）
   - 统一日志输出，便于排查
   - 暴露 window.DataLoader，无需 import
   ============================================ */

(function () {
  "use strict";

  // ---- 1. 数据源配置（修改这里即可调整内容来源） ----
  const CONFIG = {
    blog: {
      categories: [
        { slug: "mathematics",       name: "数学",   file: "data/blog/posts-math.json" },
        { slug: "finance",           name: "金融",   file: "data/blog/posts-finance.json" },
        { slug: "computer-science",  name: "计算机", file: "data/blog/posts-cs.json" },
        { slug: "history",           name: "历史",   file: "data/blog/posts-history.json" },
        { slug: "random",            name: "杂谈",   file: "data/blog/posts-random.json" }
      ]
    },
    projects: {
      files: [
        "data/projects/projects-2026.json",
        "data/projects/projects-2025.json",
        "data/projects/projects-2024.json"
      ]
    }
  };

  // ---- 2. 工具函数 ----
  const log = (...args) => console.info("[data]", ...args);
  const warn = (...args) => console.warn("[data]", ...args);

  const fetchJSON = async (url, { timeout = 5000, cache = "no-cache" } = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { cache, signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${url}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  };

  // 简单内存缓存：同一 URL 在同一会话内只请求一次
  const cache = new Map();
  const cachedFetch = (url) => {
    if (cache.has(url)) return cache.get(url);
    const p = fetchJSON(url).catch((e) => {
      cache.delete(url); // 失败时清掉，下次可重试
      throw e;
    });
    cache.set(url, p);
    return p;
  };

  // ---- 3. 业务加载器 ----

  // 加载全部博客文章 + 分类清单
  const loadAllPosts = async () => {
    const results = await Promise.allSettled(
      CONFIG.blog.categories.map((c) => cachedFetch(c.file))
    );

    const categories = CONFIG.blog.categories.map((c) => ({
      slug: c.slug,
      name: c.name
    }));
    const posts = [];

    results.forEach((r, i) => {
      const cat = CONFIG.blog.categories[i];
      if (r.status === "rejected") {
        warn(`跳过分类 ${cat.slug}:`, r.reason.message);
        return;
      }
      const data = r.value;
      if (!data || !Array.isArray(data.posts)) {
        warn(`分类 ${cat.slug} 的数据格式不正确（缺 posts 数组）`);
        return;
      }
      data.posts.forEach((p) => {
        posts.push({
          ...p,
          // 强制以配置文件中的 category 为准，避免 JSON 写错
          category: cat.slug,
          categoryName: cat.name
        });
      });
    });

    // 按日期降序排序
    posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    log(`加载博客：${posts.length} 篇 / ${categories.length} 个分类`);
    return { categories, posts };
  };

  // 加载单个文章（用于 post.html）
  const loadPost = async (slug) => {
    const { posts } = await loadAllPosts();
    return posts.find((p) => p.slug === slug) || null;
  };

  // 加载全部作品
  const loadAllProjects = async () => {
    const results = await Promise.allSettled(
      CONFIG.projects.files.map((f) => cachedFetch(f))
    );

    const projects = [];
    results.forEach((r, i) => {
      const file = CONFIG.projects.files[i];
      if (r.status === "rejected") {
        warn(`跳过 ${file}:`, r.reason.message);
        return;
      }
      const data = r.value;
      if (!data || !Array.isArray(data.projects)) {
        warn(`${file} 数据格式不正确（缺 projects 数组）`);
        return;
      }
      projects.push(...data.projects);
    });

    // featured 排前面
    projects.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.year || 0) - new Date(a.year || 0);
    });

    log(`加载作品：${projects.length} 个`);
    return projects;
  };

  // ---- 4. 暴露 API ----
  window.DataLoader = {
    loadAllPosts,
    loadPost,
    loadAllProjects,
    // 提供给调试用
    config: CONFIG
  };
})();
