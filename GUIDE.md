# Brian's Website 维护与扩展指南

---

## 一、整体架构与文件清单

### 顶层 HTML 页面（共 5 个，对应网站 5 个一级入口）

- `index.html` — 首页。英雄区 + 最新文章 + 精选作品。
- `blog.html` — 博客列表。从 `data/posts.json` 动态渲染。
- `post.html` — 文章详情通用模板。通过 `?slug=xxx` 加载任意文章。
- `portfolio.html` — 作品集。从 `data/projects.json` 动态渲染。
- `about.html` — 关于页。个人简介、技术栈、联系方式。

### 数据层（JSON 是「唯一真相源」）

- `data/posts.json` — 全部文章的元数据索引。
  结构：`{ categories:[...], posts:[...] }`
- `data/projects.json` — 全部作品的元数据索引。
  结构：`{ projects:[...] }`

### 内容层（Markdown 源文件）

```
posts/
├── mathematics/        # 数学分类下的所有 .md 文章
├── finance/            # 金融分类
├── computer-science/   # 计算机分类
├── history/            # 历史分类
└── random/             # 杂谈分类
```

> 注意：分类文件夹名必须与 `posts.json` 中 categories 的 slug 一一对应。

### 样式与脚本

- `assets/css/style.css` — 全部 Apple 极简风样式、CSS 变量、响应式。
- `assets/js/main.js` — 导航、毛玻璃、滚动渐入 IntersectionObserver。
- `assets/js/home.js` — 首页「最新文章」「精选作品」渲染。
- `assets/js/blog.js` — 博客列表 + 分类 tab 切换。
- `assets/js/post.js` — 文章详情：取索引、读 .md、剥离 frontmatter、调用 marked.js 渲染、highlight.js 高亮。
- `assets/js/portfolio.js` — 作品集：featured 大图 + 网格卡片。

### 外部 CDN 依赖（在 `post.html` 中通过 `<script src="...">` 引入）

- **marked.js** — Markdown → HTML
- **highlight.js** — 代码块语法高亮

这两个只在 `post.html` 用到，加载失败不会影响其他页面。

---

## 二、日常内容更新流程

### 场景 A：新增一篇文章（最常见）

**步骤 1 — 写 Markdown**

在 `posts/{分类}/` 下新建文件，比如 `posts/mathematics/godel.md`。
推荐在文件开头加 YAML frontmatter（`post.js` 会自动剥离）：

```markdown
---
title: 哥德尔不完备定理笔记
date: 2026-08-12
category: 数学
---

正文用标准 Markdown 语法。代码块用 ` ``` ` 包裹，可标注语言
（如 ` ```python`）触发代码高亮。图片用 R2 绝对 URL 直接插入。
```

**步骤 2 — 在 `data/posts.json` 的 `posts` 数组里追加一条索引：**

```json
{
  "slug": "godel",
  "title": "哥德尔不完备定理笔记",
  "category": "mathematics",
  "date": "2026-08-12",
  "excerpt": "一句话摘要，会显示在卡片上",
  "cover": "https://media.brian.com/posts/godel/cover.jpg",
  "tags": ["数理逻辑", "Gödel"],
  "file": "posts/mathematics/godel.md"
}
```

> `slug` 命名规则：小写英文 + 短横线，避免中文（URL 更干净）。

**步骤 3 — 上传封面图到 Cloudflare R2**

- 推荐目录结构：`media.brian.com/posts/{分类}/{slug}/cover.jpg`
- 工具建议：
  - 桌面端：用 rclone sync 或 Cyberduck / Mountain Duck
  - 命令行：`rclone sync ./images r2:media/posts`
- 写文章时直接把 R2 上的最终 URL 粘到 `cover` 字段。

**步骤 4 — 本地预览**

浏览器打开 `http://localhost:8000/blog.html`，分类 tab 切换、点开文章查看 Markdown 渲染、代码高亮是否正常。

**步骤 5 — 部署到 GitHub Pages**

```bash
cd "Brian's website"
git add .
git commit -m "post: godel"
git push origin main
```

推送后 30 秒内 GitHub Pages 会自动部署，线上立刻可见。整个流程无需任何后端、无需重新构建。

### 场景 B：新增一个作品

在 `data/projects.json` 的 `projects` 数组里追加：

```json
{
  "slug": "alpha-lab",
  "title": "AlphaLab",
  "tagline": "一句话亮点（出现在卡片和首页）",
  "description": "2-3 句详细说明（出现在作品集大图区）",
  "cover": "https://media.brian.com/projects/alpha-lab/cover.jpg",
  "tags": ["Python", "Pandas"],
  "github": "https://github.com/yourname/alpha-lab",
  "featured": true,
  "year": "2026"
}
```

- `featured: true` 出现在作品集顶部大图，其余进入下方网格。
- 上传项目封面到 R2：`media.brian.com/projects/{slug}/cover.jpg`
- 其他流程与文章一致。

---

## 三、各部位修改指南

### 3.1 修改导航栏 / 全站页脚

所有页面的 `<nav class="nav">` 和 `<footer class="footer">` 块完全相同。

**修改方法**：

1. 改完 `index.html` 中的导航和页脚
2. 把同一段复制到 `blog.html`、`post.html`、`portfolio.html`、`about.html`

**进阶做法（推荐）**：把导航和页脚抽出到独立片段，等以后想用 Eleventy / Astro 时可直接接入组件系统。本模板刻意保持纯静态，便于理解与维护。

### 3.2 修改首页 Hero 简介

打开 `index.html`，找到：

```html
<p class="hero-eyebrow reveal">Researcher · Engineer · Writer</p>
<h1 class="hero-title reveal">用代码与文字，<br />探索世界的底层逻辑。</h1>
<p class="hero-sub reveal">数学、金融、计算机与历史之间的交叉地带。</p>
```

直接改这三行的文字即可。

Hero 下方「开始阅读 / 查看作品」两个按钮：

```html
<a class="btn btn-primary" href="blog.html">开始阅读</a>
<a class="btn btn-secondary" href="portfolio.html">查看作品</a>
```

想换成自定义跳转（如同名 GitHub 主页），改 `href` 即可。

### 3.3 修改关于页内容

打开 `about.html`，按需修改：

- **「研究兴趣」段落**：`<h2>研究兴趣</h2>` 下面 `<p>` 文字
- **「技术栈」标签**：`<span class="project-tag">Python</span>` 这种结构
- **「联系」按钮区**：把 `[email protected]` 改成你的真实邮箱
- **邮件**：全局搜索 `mailto:[email protected]`，替换为你邮箱
- **GitHub**：全局搜索 `https://github.com/` 替换为你的仓库地址

### 3.4 修改网站标题（浏览器标签页文字）

每个 HTML 文件的 `<title>Brian · 研究者 / 工程师</title>` 改为自己想要的。
`post.html` 的标题会被 `post.js` 动态覆盖为「文章标题 · Brian」，末尾的「· Brian」后缀在 `post.js` 第 30 行：

```js
document.title = `${post.title} · Brian`;
```

### 3.5 修改主题色 / 字体

打开 `assets/css/style.css` 顶部 `:root` 块：

```css
--accent: #0071e3;            /* 主题色（Apple Blue） */
--text: #1d1d1f;              /* 主文字色 */
--bg: #ffffff;                /* 页面背景 */
--font-sans: -apple-system... /* 字体栈 */
```

暗色模式在 `@media (prefers-color-scheme: dark)` 块里，平行修改即可。
想关掉暗色模式：把整个 `@media` 块删掉。

### 3.6 新增一个分类 / 专栏

比如想加「读书」分类（slug: `reading`）：

**1. 在 `data/posts.json` 的 `categories` 数组追加：**

```json
{ "slug": "reading", "name": "读书" }
```

**2. 在 `posts/` 下新建 `reading/` 目录：**

```bash
mkdir posts/reading
```

**3. 以后往这个分类投稿：**

- `posts/reading/{slug}.md`
- `data/posts.json` 里 `category` 字段写 `"reading"`

分类 tab 会自动出现在博客页顶部，无需改 JS。

### 3.7 增删首页板块

`index.html` 的结构是：

```html
<header class="hero">...</header>          <!-- 简介 -->
<section class="section">...</section>     <!-- 最新文章 -->
<section class="section">...</section>     <!-- 精选作品 -->
```

**加新区块**（如「最近分享 / Newsletter 订阅 / 时间线」）：复制其中一个 `<section class="section">...</section>` 块，改标题和内容，必要的话写新的 `home.js` 渲染函数。

**删一个区块**：直接删掉对应 `<section>` 整块。

### 3.8 修改作品集布局

`portfolio.html` 里：

- 顶部大图区：`<div id="project-featured">`，由 `portfolio.js` 把 `featured: true` 的项目渲染进去
- 下方网格：`<div id="project-grid">`，渲染其余项目

**想改大图左右比例**：编辑 `style.css` 中 `.project-feature-grid` 的 `grid-template-columns: 1fr 1fr;`

**想要多张大图交错展示**：把每个项目单独写一个 `<div class="project-feature">...</div>` 块，配合 `.project-feature.reverse` 类让图片左右交替（CSS 已支持）。

### 3.9 全局修改（一次性搜替换）

- **改用户名 / 邮箱 / GitHub 链接**：在所有 HTML 文件里搜 `[email protected]` 或 `https://github.com/` 即可
- **改页脚版权年份**：`style.css` / 各 HTML 里搜 `2026`
- **改「Brian」品牌名**：所有 HTML 顶部 `<a class="nav-logo">Brian</a>`

### 3.10 R2 图床维护建议

- 启用 R2 公共桶 + 自定义域（推荐 `media.brian.com`）
- 文章配图统一目录：`media.brian.com/posts/{cat}/{slug}/`
- 作品封面统一目录：`media.brian.com/projects/{slug}/`
- 上传后粘 URL 即可，无需改任何代码
- 大图建议 1600px 宽，封面 1200px，缩略图用 R2 的图片处理（或用 `?w=1200` 这样的 query 参数 Unsplash 也支持）

### 3.11 性能与 SEO 进阶（可选）

- 给每篇文章配 OG image（在 `posts.json` 加 `ogImage` 字段，扩展 `post.html`）
- 想加 RSS：在根目录建 `feed.xml`，按 `posts.json` 排序生成
- 想加 sitemap：建 `sitemap.xml`，列所有 `post.html?slug=xxx`
- 想加 PWA：建 `manifest.json` + 一个 service worker
- 想全站缓存控制：`post.html` 已加 no-store meta，可推广到其他页

---

## 四、紧急排错清单

- **页面打开是空白 / 加载失败**：F12 控制台看错误，多半是 JSON 写错（逗号、引号）→ 用 jsonlint.com 验证
- **文章点了没反应**：检查 `data/posts.json` 里 `file` 路径是否对
- **图片 404**：检查 R2 URL 是否可独立访问
- **改了 CSS 没生效**：`Cmd+Shift+R` 硬刷新
- **改了 JS 报错**：检查是否漏了函数、或者忘了 `escapeHTML`

---

## 五、版本演进路线（可选）

当内容变多 / 想加评论 / 搜索时：

1. **评论**：注入 utterances / giscus（基于 GitHub Issues）
2. **搜索**：用 Fuse.js 在 `blog.js` 里做客户端模糊匹配
3. **标签聚合**：在 `posts.json` 加 tags 字段，`blog.html` 加 tag 页
4. **RSS**：在根目录写一个 build 脚本（GitHub Action）从 `posts.json` 生成 `feed.xml`

当觉得 5 个 HTML 重复太多时：迁移到 Eleventy / Astro / Hugo，保留同一套设计语言。这是当前的「天花板」边界 —— 纯静态已经够用很久了。

---

> 指南结束。如需对任何模块做更细的拆解，告诉我。
