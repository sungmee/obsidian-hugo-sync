# Hugo Sync

一键同步 Obsidian 笔记到 Hugo 博客，支持双链转换、图片链接转换与文件自动监听。

[English version](README.md)

---

## 功能

- **一键同步** — 点击 ribbon 图标或命令面板，将笔记同步到 Hugo 的 `content/` 目录
- **双链转换** — `[[wikilink]]` 自动转为 Hugo 标准链接格式
  - `posts/` 目录永远转换
  - 非 posts 目录可在设置中独立开关
- **图片链接转换** — `![[image.png]]` 自动转为标准 Markdown 图片链接
- **文件监听** — 源目录文件变更自动触发同步，带防抖（可关闭）
- **目录镜像** — 源目录结构完整复制到 Hugo 的 `content/` 目录
- **删除确认** — 源目录有文件被删除时，弹出确认对话框防止误删

---

## 安装

### 从源码构建

```bash
git clone https://github.com/sungmee/obsidian-hugo-sync.git
cd obsidian-hugo-sync
npm install
npm run build
```

然后将 `main.js` 和 `manifest.json` 复制到 vault 的 `.obsidian/plugins/obsidian-hugo-sync/` 目录：

```
.obsidian/plugins/obsidian-hugo-sync/
├── main.js
└── manifest.json
```

在 设置 → 第三方插件 中启用 **Hugo Sync**。

### symlink 方式（推荐开发时使用）

```bash
ln -s /path/to/obsidian-hugo-sync \
  "/path/to/vault/.obsidian/plugins/obsidian-hugo-sync"
```

---

## 设置项

| 设置 | 默认值 | 说明 |
|---|---|---|
| 源目录 | *(空)* | vault 内 Hugo 文章源目录，如 `50-output/lxooo.com` |
| Hugo content 目录 | *(空)* | Hugo 项目 `content/` 目录的绝对路径 |
| 非 posts 目录双链转换 | 关闭 | `about/`、`archives/`、`tags/` 等是否也转换 wikilink |
| 永久链接格式 | `/:slug/` | wikilink 生成的 URL 格式，`:slug` 替换为文章 slug |
| 图片基础链接 | *(空)* | 图片基础 URL，留空则不转换图片 |
| 文件监听 | 开启 | 源目录文件变更时自动同步 |
| 防抖间隔 | `10` | 文件变更后等待多少秒无新变更才触发同步 |

### 永久链接格式

`:slug` 作为占位符，会在转换时替换为文章实际的 slug。

| Hugo 永久链接配置 | 格式 | 输出示例 |
|---|---|---|
| `posts = '/:slug/'`（默认） | `/:slug/` | `[title](/my-post/)` |
| `posts = '/:slug.html'` | `/:slug.html` | `[title](/my-post.html)` |
| `posts = '/posts/:slug/'` | `/posts/:slug/` | `[title](/posts/my-post/)` |

### 图片链接转换

配置图片基础链接后，所有同步文件中的 Obsidian 图片嵌入自动转换：

```
![[photo.png]]           →  ![photo.png](https://cdn.example.com/photo.png)
![[photo.png|200*100]]   →  ![photo.png](https://cdn.example.com/photo.png)
![[img/2024/photo.png]]  →  ![photo.png](https://cdn.example.com/img/2024/photo.png)
```

此项独立于 wikilink 转换，对所有文件生效。

---

## 使用

- 点击左侧边栏的 🔄 图标
- 或使用命令面板：`Hugo: 同步到 Hugo`
- 开启文件监听后，保存笔记即自动同步

---

## 双链转换规则

| Obsidian 语法 | Hugo 输出 | 说明 |
|---|---|---|
| `[[文章名]]` | `[frontmatter title](/slug/)` | 显示目标文章的 `title` |
| `[[非公开笔记]]` | `非公开笔记` | 未匹配到 slug → 纯文本，避免死链 |
| `[[文章名#标题]]` | `[标题](/slug/#标题)` | 锚点链接，显示标题文字 |
| `[[文章名\|别名]]` | `[别名](/slug/)` | 别名优先 |

> **锚点一致性：** Obsidian 的 `#标题` 必须与 Hugo Goldmark 生成的 HTML ID 一致。建议在 Markdown 中使用 `## 标题 {#标题}` 语法显式指定 ID。

---

## 开发

```bash
npm install
npm run dev    # 单次构建
npm run build  # 生产构建
```

---

## 协议

[GPL v3](LICENSE)
