"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => HugoPublishPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian2 = require("obsidian");

// settings.ts
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  sourceDir: "",
  hugoContentDir: "",
  convertNonPostsWikilinks: false,
  permalinkFormat: "/:slug/",
  imageBaseURL: "",
  watchEnabled: true,
  debounceSeconds: 10
};
var HugoPublishSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("\u6E90\u76EE\u5F55").setDesc("Obsidian vault \u4E2D\u7684 Hugo \u6587\u7AE0\u6E90\u76EE\u5F55\uFF08\u76F8\u5BF9\u8DEF\u5F84\uFF09\uFF0C\u4F8B\u5982 50-output/lxooo.com").addText(
      (text) => text.setPlaceholder("50-output/lxooo.com").setValue(this.plugin.settings.sourceDir).onChange(async (value) => {
        this.plugin.settings.sourceDir = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Hugo content \u76EE\u5F55").setDesc("Hugo \u9879\u76EE\u7684 content \u76EE\u5F55\u7EDD\u5BF9\u8DEF\u5F84").addText(
      (text) => text.setPlaceholder("/Users/xxx/Projects/com.lxooo/content").setValue(this.plugin.settings.hugoContentDir).onChange(async (value) => {
        this.plugin.settings.hugoContentDir = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u975E posts \u76EE\u5F55\u53CC\u94FE\u8F6C\u6362").setDesc(
      "\u5F00\u542F\u540E\uFF0Cabout/archives/tags \u7B49\u975E posts \u76EE\u5F55\u4E0B\u7684 .md \u6587\u4EF6\u4E5F\u4F1A\u8F6C\u6362 wikilink\u3002posts/ \u76EE\u5F55\u6C38\u8FDC\u8F6C\u6362\uFF0C\u4E0D\u53D7\u6B64\u5F00\u5173\u5F71\u54CD\u3002"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.convertNonPostsWikilinks).onChange(async (value) => {
        this.plugin.settings.convertNonPostsWikilinks = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6C38\u4E45\u94FE\u63A5\u683C\u5F0F").setDesc(
      "wikilink \u8F6C\u6362\u540E\u7684 URL \u683C\u5F0F\u3002:slug \u4F1A\u88AB\u66FF\u6362\u4E3A\u6587\u7AE0\u7684\u5B9E\u9645 slug\u3002\u9ED8\u8BA4 /:slug/ \u5339\u914D Hugo uglyURLs=false \u7684\u8F93\u51FA\u3002\u4F8B\u5982 /posts/:slug.html \u6216 /:year/:slug/"
    ).addText(
      (text) => text.setPlaceholder("/:slug/").setValue(this.plugin.settings.permalinkFormat).onChange(async (value) => {
        this.plugin.settings.permalinkFormat = value.trim() || "/:slug/";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u56FE\u7247\u57FA\u7840\u94FE\u63A5").setDesc(
      "\u5C06 Obsidian \u56FE\u7247\u5D4C\u5165 ![[image.png]] \u8F6C\u6362\u4E3A\u6807\u51C6 Markdown \u56FE\u7247\u94FE\u63A5\u3002\u914D\u7F6E\u540E\uFF0C\u6240\u6709\u5DF2\u540C\u6B65\u6587\u4EF6\u4E2D\u7684\u56FE\u7247\u5D4C\u5165\u90FD\u4F1A\u88AB\u8F6C\u6362\u3002\u7559\u7A7A\u5219\u4E0D\u8F6C\u6362\u3002"
    ).addText(
      (text) => text.setPlaceholder("https://cdn.example.com/images").setValue(this.plugin.settings.imageBaseURL).onChange(async (value) => {
        this.plugin.settings.imageBaseURL = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6587\u4EF6\u76D1\u542C").setDesc(
      "\u5F00\u542F\u540E\uFF0C\u6E90\u76EE\u5F55\u6587\u4EF6\u53D8\u66F4\u65F6\u81EA\u52A8\u540C\u6B65\u3002\u5173\u95ED\u540E\u9700\u624B\u52A8\u70B9\u51FB\u6309\u94AE\u89E6\u53D1\u540C\u6B65\u3002"
    ).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.watchEnabled).onChange(async (value) => {
        this.plugin.settings.watchEnabled = value;
        await this.plugin.saveSettings();
        this.plugin.applyWatchMode();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u9632\u6296\u95F4\u9694\uFF08\u79D2\uFF09").setDesc("\u6587\u4EF6\u53D8\u66F4\u540E\u7B49\u5F85\u591A\u5C11\u79D2\u65E0\u65B0\u53D8\u66F4\u624D\u89E6\u53D1\u540C\u6B65\u3002\u4EC5\u5728\u76D1\u542C\u5F00\u542F\u65F6\u751F\u6548\u3002").addSlider(
      (slider) => slider.setLimits(1, 60, 1).setValue(this.plugin.settings.debounceSeconds).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.debounceSeconds = value;
        await this.plugin.saveSettings();
      })
    );
  }
};

// sync-engine.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;
var WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
var IMAGE_EMBED_RE = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
var SLUG_RE = /^slug:\s*["']?(.+?)["']?$/m;
var TITLE_RE = /^title:\s*["']?(.+?)["']?$/m;
function parseFrontmatter(text) {
  const match = FRONTMATTER_RE.exec(text);
  return match ? match[1] : "";
}
function extractSlug(frontmatter) {
  const match = SLUG_RE.exec(frontmatter);
  return match ? match[1].trim() : null;
}
function extractTitle(frontmatter) {
  const match = TITLE_RE.exec(frontmatter);
  return match ? match[1].trim() : null;
}
async function listMdFiles(app, dir) {
  const result = [];
  try {
    const listed = await app.vault.adapter.list(dir);
    for (const file of listed.files) {
      if (file.endsWith(".md")) {
        result.push(file);
      }
    }
    for (const subdir of listed.folders) {
      const subFiles = await listMdFiles(app, subdir);
      result.push(...subFiles);
    }
  } catch (e) {
  }
  return result;
}
function listHugoMdFiles(hugoContentDir) {
  const result = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
      return;
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".md")) {
        result.push(fullPath);
      }
    }
  }
  walk(hugoContentDir);
  return result;
}
async function buildSlugMaps(app, sourceDir) {
  var _a, _b;
  const slugMap = /* @__PURE__ */ new Map();
  const titleMap = /* @__PURE__ */ new Map();
  const files = await listMdFiles(app, sourceDir);
  for (const filePath of files) {
    let text;
    try {
      text = await app.vault.adapter.read(filePath);
    } catch (e) {
      continue;
    }
    const frontmatter = parseFrontmatter(text);
    if (!frontmatter)
      continue;
    const slug = extractSlug(frontmatter);
    if (!slug)
      continue;
    const stem = (_b = (_a = filePath.split("/").pop()) == null ? void 0 : _a.replace(/\.md$/, "")) != null ? _b : "";
    slugMap.set(stem, slug);
    const title = extractTitle(frontmatter);
    if (title) {
      slugMap.set(title, slug);
      titleMap.set(stem, title);
    }
  }
  return { slugMap, titleMap };
}
function replaceWikilink(_target, alias, slugMap, titleMap, permalinkFormat) {
  var _a, _b, _c;
  let target = _target.trim();
  if (alias)
    alias = alias.trim();
  let targetName;
  let anchor;
  let anchorPart;
  if (target.includes("#")) {
    const idx = target.indexOf("#");
    targetName = target.substring(0, idx).trim();
    anchorPart = target.substring(idx + 1).trim();
    anchor = anchorPart ? `#${anchorPart}` : "";
  } else {
    targetName = target;
    anchor = "";
    anchorPart = "";
  }
  const lookupKey = (_b = (_a = targetName.split("/").pop()) == null ? void 0 : _a.replace(/\.\w+$/, "")) != null ? _b : targetName;
  const slug = slugMap.get(lookupKey);
  if (!slug) {
    return alias || targetName;
  }
  let display;
  if (alias) {
    display = alias;
  } else if (anchor) {
    display = anchorPart;
  } else {
    display = (_c = titleMap.get(lookupKey)) != null ? _c : targetName;
  }
  const url = permalinkFormat.replace(":slug", slug);
  return `[${display}](${url}${anchor})`;
}
function transformWikilinks(content, slugMap, titleMap, permalinkFormat) {
  return content.replace(WIKILINK_RE, (match, target, alias) => {
    return replaceWikilink(target, alias, slugMap, titleMap, permalinkFormat);
  });
}
function transformImageLinks(content, imageBaseURL) {
  const base = imageBaseURL.replace(/\/+$/, "");
  return content.replace(IMAGE_EMBED_RE, (match, target) => {
    var _a;
    const imagePath = target.trim();
    const alt = (_a = imagePath.split("/").pop()) != null ? _a : imagePath;
    return `![${alt}](${base}/${imagePath})`;
  });
}
async function syncAll(app, sourceDir, hugoContentDir, convertNonPosts, permalinkFormat, imageBaseURL) {
  const errors = [];
  const { slugMap, titleMap } = await buildSlugMaps(app, sourceDir);
  const sourceFiles = await listMdFiles(app, sourceDir);
  if (!fs.existsSync(hugoContentDir)) {
    fs.mkdirSync(hugoContentDir, { recursive: true });
  }
  let updated = 0;
  const processedRelPaths = /* @__PURE__ */ new Set();
  for (const vaultPath of sourceFiles) {
    try {
      const relPath = vaultPath.substring(sourceDir.length + 1);
      processedRelPaths.add(relPath);
      let content = await app.vault.adapter.read(vaultPath);
      const isPost = relPath.startsWith("posts/");
      const shouldConvert = isPost || convertNonPosts;
      if (shouldConvert) {
        content = transformWikilinks(content, slugMap, titleMap, permalinkFormat);
      }
      if (imageBaseURL) {
        content = transformImageLinks(content, imageBaseURL);
      }
      const dstPath = path.join(hugoContentDir, relPath);
      const dstDir = path.dirname(dstPath);
      fs.mkdirSync(dstDir, { recursive: true });
      fs.writeFileSync(dstPath, content, "utf-8");
      updated++;
    } catch (err) {
      errors.push(`${vaultPath}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  const hugoFiles = listHugoMdFiles(hugoContentDir);
  const extraFiles = [];
  for (const hugoPath of hugoFiles) {
    const relPath = path.relative(hugoContentDir, hugoPath);
    if (!processedRelPaths.has(relPath)) {
      extraFiles.push(relPath);
    }
  }
  return { updated, extraFiles, errors };
}
function deleteExtraFiles(hugoContentDir, extraFiles) {
  let deleted = 0;
  for (const relPath of extraFiles) {
    const fullPath = path.join(hugoContentDir, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        deleted++;
        let dir = path.dirname(fullPath);
        while (dir !== hugoContentDir && dir.startsWith(hugoContentDir)) {
          try {
            const remaining = fs.readdirSync(dir);
            if (remaining.length === 0 || remaining.length === 1 && remaining[0] === ".DS_Store") {
              if (remaining.length === 1)
                fs.unlinkSync(path.join(dir, ".DS_Store"));
              fs.rmdirSync(dir);
              dir = path.dirname(dir);
            } else {
              break;
            }
          } catch (e) {
            break;
          }
        }
      }
    } catch (e) {
    }
  }
  return deleted;
}

// main.ts
var DeleteConfirmModal = class extends import_obsidian2.Modal {
  constructor(app, extraFiles, onConfirm) {
    super(app);
    this.extraFiles = extraFiles;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "\u68C0\u6D4B\u5230\u591A\u4F59\u6587\u4EF6" });
    const infoEl = contentEl.createEl("p");
    infoEl.createEl("strong", {
      text: `Hugo content \u4E2D\u6709 ${this.extraFiles.length} \u4E2A\u6587\u4EF6\u5728\u6E90\u76EE\u5F55\u4E2D\u5DF2\u4E0D\u5B58\u5728\uFF1A`
    });
    const list = contentEl.createEl("ul", { cls: "hugo-sync-delete-list" });
    const displayFiles = this.extraFiles.slice(0, 20);
    for (const file of displayFiles) {
      list.createEl("li", { text: file });
    }
    if (this.extraFiles.length > 20) {
      list.createEl("li", {
        text: `... \u4EE5\u53CA\u5176\u4ED6 ${this.extraFiles.length - 20} \u4E2A\u6587\u4EF6`
      });
    }
    contentEl.createEl("p", { text: "\u662F\u5426\u4ECE Hugo content \u76EE\u5F55\u4E2D\u5220\u9664\u8FD9\u4E9B\u6587\u4EF6\uFF1F" });
    const buttonRow = contentEl.createDiv({ cls: "hugo-sync-buttons" });
    buttonRow.style.display = "flex";
    buttonRow.style.justifyContent = "flex-end";
    buttonRow.style.gap = "8px";
    buttonRow.style.marginTop = "16px";
    buttonRow.createEl("button", { text: "\u53D6\u6D88" }, (el) => {
      el.addEventListener("click", () => this.close());
    });
    buttonRow.createEl("button", { text: "\u5220\u9664", cls: "mod-warning" }, (el) => {
      el.addEventListener("click", () => {
        this.onConfirm();
        this.close();
      });
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var HugoPublishPlugin = class extends import_obsidian2.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    /** 防抖定时器 */
    this.debounceTimer = null;
    /** 是否正在同步（防止并发） */
    this.syncing = false;
    /** 文件监听事件引用（用于动态注销） */
    this.watchEventRefs = [];
  }
  // ==========================================================
  // 生命周期
  // ==========================================================
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("folder-sync", "Hugo \u540C\u6B65", () => this.doSync());
    this.addCommand({
      id: "hugo-sync",
      name: "\u540C\u6B65\u5230 Hugo",
      callback: () => this.doSync()
    });
    this.addSettingTab(new HugoPublishSettingTab(this.app, this));
    this.applyWatchMode();
  }
  onunload() {
    this.clearWatch();
  }
  // ==========================================================
  // 设置
  // ==========================================================
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // ==========================================================
  // 文件监听
  // ==========================================================
  /** 根据 watchEnabled 设置启动或停止监听 */
  applyWatchMode() {
    this.clearWatch();
    if (this.settings.watchEnabled) {
      this.startWatch();
    }
  }
  startWatch() {
    const { sourceDir } = this.settings;
    if (!sourceDir)
      return;
    const isInSourceDir = (filePath) => {
      return filePath === sourceDir || filePath.startsWith(sourceDir + "/");
    };
    const onChange = (file) => {
      if (this.syncing)
        return;
      if (isInSourceDir(file.path)) {
        this.debouncedSync();
      }
    };
    const onDelete = (file) => {
      if (this.syncing)
        return;
      if (isInSourceDir(file.path)) {
        this.debouncedSync();
      }
    };
    this.watchEventRefs.push(
      this.app.vault.on("modify", onChange),
      this.app.vault.on("create", onChange),
      this.app.vault.on("delete", onDelete)
    );
  }
  clearWatch() {
    for (const ref of this.watchEventRefs) {
      this.app.vault.offref(ref);
    }
    this.watchEventRefs = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
  /** 防抖触发同步 */
  debouncedSync() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.doSync();
    }, this.settings.debounceSeconds * 1e3);
  }
  // ==========================================================
  // 同步主流程
  // ==========================================================
  async doSync() {
    const {
      sourceDir,
      hugoContentDir,
      convertNonPostsWikilinks,
      permalinkFormat,
      imageBaseURL
    } = this.settings;
    if (!sourceDir) {
      new import_obsidian2.Notice("\u274C \u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u300C\u6E90\u76EE\u5F55\u300D");
      return;
    }
    if (!hugoContentDir) {
      new import_obsidian2.Notice("\u274C \u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u300CHugo content \u76EE\u5F55\u300D");
      return;
    }
    if (this.syncing) {
      new import_obsidian2.Notice("\u23F3 \u540C\u6B65\u6B63\u5728\u8FDB\u884C\u4E2D\uFF0C\u8BF7\u7A0D\u5019...");
      return;
    }
    this.syncing = true;
    const notice = new import_obsidian2.Notice("\u{1F504} \u6B63\u5728\u540C\u6B65...", 0);
    try {
      const result = await syncAll(
        this.app,
        sourceDir,
        hugoContentDir,
        convertNonPostsWikilinks,
        permalinkFormat,
        imageBaseURL
      );
      notice.hide();
      if (result.errors.length > 0) {
        console.warn("Hugo Sync \u9519\u8BEF:", result.errors);
        new import_obsidian2.Notice(`\u26A0\uFE0F ${result.updated} \u7BC7\u5DF2\u540C\u6B65\uFF0C${result.errors.length} \u4E2A\u9519\u8BEF\uFF08\u67E5\u770B\u63A7\u5236\u53F0\uFF09`, 6e3);
      }
      if (result.extraFiles.length > 0) {
        new DeleteConfirmModal(
          this.app,
          result.extraFiles,
          () => {
            const deleted = deleteExtraFiles(hugoContentDir, result.extraFiles);
            new import_obsidian2.Notice(
              `\u2705 \u540C\u6B65\u5B8C\u6210\uFF1A${result.updated} \u7BC7\u5DF2\u66F4\u65B0\uFF0C${deleted} \u7BC7\u5DF2\u5220\u9664` + (result.errors.length > 0 ? `\uFF0C${result.errors.length} \u4E2A\u9519\u8BEF` : ""),
              6e3
            );
          }
        ).open();
      } else {
        new import_obsidian2.Notice(
          `\u2705 \u540C\u6B65\u5B8C\u6210\uFF1A${result.updated} \u7BC7\u5DF2\u66F4\u65B0` + (result.errors.length > 0 ? `\uFF0C${result.errors.length} \u4E2A\u9519\u8BEF` : ""),
          4e3
        );
      }
    } catch (err) {
      notice.hide();
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Hugo Sync \u5F02\u5E38:", err);
      new import_obsidian2.Notice(`\u274C \u540C\u6B65\u5931\u8D25\uFF1A${msg}`, 8e3);
    } finally {
      this.syncing = false;
    }
  }
};
