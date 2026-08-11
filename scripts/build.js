/* ============================================
   build.js — 扫描 .md 自动生成索引 + 改写图片路径
   ------------------------------------------------------------
   读：
     posts/{category}/{slug}.md           →  源 Markdown（带 frontmatter）
     assets/images/{category}/{slug}/...  →  源图片（同步到 R2）

   写：
     data/blog/posts-*.json               →  索引（被页面 JS 读取）
     posts-dist/{category}/{slug}.md      →  改写后的 Markdown
                                              （把 ./assets/images/... 替换成 R2 绝对 URL）

   环境变量：
     R2_PUBLIC_URL  形如 https://pub-xxx.r2.dev
                    不设 → 保持相对路径（本地预览用）
     R2_BUCKET      桶名，默认 brian-website
   ============================================ */

import { glob } from "glob";
import matter from "gray-matter";
import fs from "fs/promises";
import path from "path";

const CATEGORY_NAME = {
  mathematics: "数学",
  finance: "金融",
  "computer-science": "计算机",
  history: "历史",
  random: "杂谈"
};

// 文件名简写映射（与 data.js 保持一致）
const SLUG_MAP = { "computer-science": "cs" };

const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").replace(/\/$/, "");
const R2_BUCKET = process.env.R2_BUCKET || "brian-website";
const USE_R2 = Boolean(R2_PUBLIC_URL);

const log = (msg) => console.log(`[build] ${msg}`);

// 把 ./assets/images/foo.jpg 改写成 R2 绝对 URL
const rewriteContent = (md) => {
  if (!USE_R2) return md;
  return md
    // Markdown 图片语法：![alt](./assets/images/path)
    .replace(
      /!\[([^\]]*)\]\(\.\/assets\/images\/([^)]+)\)/g,
      (_, alt, p) => `![${alt}](${R2_PUBLIC_URL}/${p})`
    )
    // HTML img 标签：<img src="./assets/images/path" ...>
    .replace(
      /(<img\s+[^>]*src=["'])\.\/assets\/images\/([^"']+)(["'])/gi,
      (_, pre, p, post) => `${pre}${R2_PUBLIC_URL}/${p}${post}`
    );
};

// 从 frontmatter 提取日期字符串
const formatDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return null;
};

// 自动探测 cover 图（按 cover.{jpg,jpeg,png,webp} 顺序）
const autoCover = async (category, slug) => {
  const exts = ["jpg", "jpeg", "png", "webp", "JPG", "JPEG", "PNG"];
  for (const ext of exts) {
    const local = `assets/images/${category}/${slug}/cover.${ext}`;
    try {
      await fs.access(local);
      return USE_R2
        ? `${R2_PUBLIC_URL}/${category}/${slug}/cover.${ext}`
        : `./assets/images/${category}/${slug}/cover.${ext}`;
    } catch {}
  }
  return "";
};

// 主流程
const main = async () => {
  log(`R2 mode: ${USE_R2 ? `ON (${R2_PUBLIC_URL})` : "OFF (local relative paths)"}`);

  const files = await glob("posts/**/*.md");
  if (!files.length) {
    log("no posts found, writing empty indexes");
  }

  const buckets = new Map();

  for (const file of files) {
    const raw = await fs.readFile(file, "utf-8");
    const { data, content } = matter(raw);
    const category = path.basename(path.dirname(file));
    const slug = path.basename(file, ".md");

    // 1) 改写正文里的相对图片路径
    const processedContent = rewriteContent(content);

    // 2) 决定 cover：frontmatter 优先，否则自动探测
    let cover = data.cover || "";
    if (!cover) cover = await autoCover(category, slug);
    if (data.cover && data.cover.startsWith("./assets/images/") && USE_R2) {
      cover = `${R2_PUBLIC_URL}/${data.cover.replace(/^\.\/assets\/images\//, "")}`;
    }

    // 3) 构造索引条目
    const post = {
      slug,
      title: data.title || slug,
      category,
      date:
        formatDate(data.date) ||
        new Date().toISOString().slice(0, 10),
      excerpt:
        data.description ||
        processedContent
          .replace(/[#*`>\-\[\]!]/g, "")
          .replace(/\n+/g, " ")
          .trim()
          .slice(0, 120),
      cover,
      tags: data.tags || [],
      file: `posts-dist/${category}/${slug}.md`
    };

    // 4) 写出改写后的 Markdown 到 posts-dist/
    const outDir = `posts-dist/${category}`;
    await fs.mkdir(outDir, { recursive: true });
    const rebuilt = matter.stringify(processedContent, data);
    await fs.writeFile(`${outDir}/${slug}.md`, rebuilt);

    // 5) 加入分类桶
    if (!buckets.has(category)) {
      buckets.set(category, {
        category: { slug: category, name: CATEGORY_NAME[category] || category },
        posts: []
      });
    }
    buckets.get(category).posts.push(post);
  }

  // 写出每个分类的 JSON 索引
  for (const [cat, payload] of buckets) {
    payload.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const fileName = `posts-${SLUG_MAP[cat] || cat}.json`;
    await fs.writeFile(
      `data/blog/${fileName}`,
      JSON.stringify(payload, null, 2) + "\n"
    );
    log(`✔ data/blog/${fileName}  (${payload.posts.length} 篇)`);
  }

  // 清空那些在 posts/ 里没有对应源文件的旧 JSON（保持同步）
  const allIndexFiles = (await glob("data/blog/posts-*.json")).map((p) =>
    path.basename(p)
  );
  for (const indexFile of allIndexFiles) {
    const cat = Object.entries(SLUG_MAP).find(([, v]) => `posts-${v}.json` === indexFile)?.[0]
      || indexFile.replace(/^posts-/, "").replace(/\.json$/, "");
    if (!buckets.has(cat) && !buckets.has(SLUG_MAP[cat])) {
      const payload = {
        category: { slug: cat, name: CATEGORY_NAME[cat] || cat },
        posts: []
      };
      await fs.writeFile(
        `data/blog/${indexFile}`,
        JSON.stringify(payload, null, 2) + "\n"
      );
      log(`✔ data/blog/${indexFile}  (empty)`);
    }
  }

  log(`🎉 build complete: ${files.length} posts processed`);
};

main().catch((e) => {
  console.error("[build] ❌", e);
  process.exit(1);
});
