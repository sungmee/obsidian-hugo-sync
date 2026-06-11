import * as fs from "fs";
import * as path from "path";
import { App } from "obsidian";

// ============================================================
// 正则表达式 — 移植自 transform.py
// ============================================================

/** 匹配 YAML frontmatter 块 */
const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---/;

/** 匹配 Obsidian wikilink：[[target]] 或 [[target|alias]] */
const WIKILINK_RE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

/** 匹配 Obsidian 图片嵌入：![[image.png]] 或 ![[image.png|尺寸]] */
const IMAGE_EMBED_RE = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

/** 从 frontmatter 中提取 slug 字段 */
const SLUG_RE = /^slug:\s*["']?(.+?)["']?$/m;

/** 从 frontmatter 中提取 title 字段 */
const TITLE_RE = /^title:\s*["']?(.+?)["']?$/m;

// ============================================================
// 类型定义
// ============================================================

/** slug 映射表：stem/标题 → slug；标题映射表：stem → title */
export interface SlugMaps {
	slugMap: Map<string, string>;
	titleMap: Map<string, string>;
}

/** 同步结果 */
export interface SyncResult {
	/** 成功更新的文件数 */
	updated: number;
	/** Hugo 目录中存在但源目录中不存在的文件（相对路径） */
	extraFiles: string[];
	/** 错误信息列表 */
	errors: string[];
}

// ============================================================
// Frontmatter 解析
// ============================================================

/** 从 Markdown 文本中提取 frontmatter 块 */
function parseFrontmatter(text: string): string {
	const match = FRONTMATTER_RE.exec(text);
	return match ? match[1] : "";
}

/** 从 frontmatter 中提取 slug */
function extractSlug(frontmatter: string): string | null {
	const match = SLUG_RE.exec(frontmatter);
	return match ? match[1].trim() : null;
}

/** 从 frontmatter 中提取 title */
function extractTitle(frontmatter: string): string | null {
	const match = TITLE_RE.exec(frontmatter);
	return match ? match[1].trim() : null;
}

// ============================================================
// 文件扫描
// ============================================================

/** 递归获取目录下所有 .md 文件的 vault 路径 */
async function listMdFiles(app: App, dir: string): Promise<string[]> {
	const result: string[] = [];
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
	} catch {
		// 目录不存在或无法访问，返回空数组
	}
	return result;
}

/** 递归获取 Hugo content 目录下所有 .md 文件的绝对路径 */
function listHugoMdFiles(hugoContentDir: string): string[] {
	const result: string[] = [];

	function walk(dir: string) {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
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

// ============================================================
// Slug 映射表构建
// ============================================================

/**
 * 扫描源目录所有 .md 文件，构建 slug_map 和 title_map
 *
 * slug_map 的 key 同时支持文件名 stem 和 frontmatter title，
 * 这样 [[文件名]] 和 [[标题]] 两种 wikilink 都能正确解析。
 */
async function buildSlugMaps(
	app: App,
	sourceDir: string
): Promise<SlugMaps> {
	const slugMap = new Map<string, string>();
	const titleMap = new Map<string, string>();

	const files = await listMdFiles(app, sourceDir);

	for (const filePath of files) {
		let text: string;
		try {
			text = await app.vault.adapter.read(filePath);
		} catch {
			continue;
		}

		const frontmatter = parseFrontmatter(text);
		if (!frontmatter) continue;

		const slug = extractSlug(frontmatter);
		if (!slug) continue;

		// 从路径提取 stem（文件名去掉 .md 扩展名）
		const stem = filePath.split("/").pop()?.replace(/\.md$/, "") ?? "";

		slugMap.set(stem, slug);

		const title = extractTitle(frontmatter);
		if (title) {
			slugMap.set(title, slug);
			titleMap.set(stem, title);
		}
	}

	return { slugMap, titleMap };
}

// ============================================================
// Wikilink 转换
// ============================================================

/**
 * 替换单个 wikilink 为 Hugo 格式
 *
 * 三种场景：
 * 1. [[post-name]]          → [frontmatter title](/slug/)
 * 2. [[非公开笔记]]           → 非公开笔记（纯文本回退）
 * 3. [[page#heading]]       → [heading](/slug/#heading)
 * 4. [[page|alias]]         → [alias](/slug/)
 */
function replaceWikilink(
	_target: string,
	alias: string | undefined,
	slugMap: Map<string, string>,
	titleMap: Map<string, string>,
	permalinkFormat: string
): string {
	let target = _target.trim();
	if (alias) alias = alias.trim();

	// 分离页面名和锚点（支持 [[page#heading]] 格式）
	let targetName: string;
	let anchor: string;
	let anchorPart: string;

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

	// 提取查找键（相当于 Path(targetName).stem）
	const lookupKey =
		targetName.split("/").pop()?.replace(/\.\w+$/, "") ?? targetName;

	const slug = slugMap.get(lookupKey);

	if (!slug) {
		// 非公开笔记：回退为纯文本，避免 Hugo 死链
		return alias || targetName;
	}

	// 确定显示文本
	let display: string;
	if (alias) {
		display = alias;
	} else if (anchor) {
		display = anchorPart; // 只显示标题文字（去掉 #）
	} else {
		display = titleMap.get(lookupKey) ?? targetName;
	}

	// 用 slug 替换格式中的占位符
	const url = permalinkFormat.replace(":slug", slug);
	return `[${display}](${url}${anchor})`;
}

/**
 * 转换内容中的所有 wikilink
 */
export function transformWikilinks(
	content: string,
	slugMap: Map<string, string>,
	titleMap: Map<string, string>,
	permalinkFormat: string
): string {
	return content.replace(WIKILINK_RE, (match, target, alias) => {
		return replaceWikilink(target, alias, slugMap, titleMap, permalinkFormat);
	});
}

/**
 * 转换 Obsidian 图片嵌入为标准 Markdown 图片链接
 *
 * ![[image.png]]          → ![image.png](baseURL/image.png)
 * ![[path/img.png|200]]   → ![img.png](baseURL/path/img.png)
 */
export function transformImageLinks(
	content: string,
	imageBaseURL: string
): string {
	// 去除末尾斜杠，避免双斜杠
	const base = imageBaseURL.replace(/\/+$/, "");

	return content.replace(IMAGE_EMBED_RE, (match, target) => {
		const imagePath = target.trim();

		// 提取文件名作为 alt 文本
		const alt = imagePath.split("/").pop() ?? imagePath;

		return `![${alt}](${base}/${imagePath})`;
	});
}

// ============================================================
// 同步主流程
// ============================================================

/**
 * 执行完整同步
 *
 * 1. 扫描源目录构建 slug 映射
 * 2. 对每个源文件：读取 → 判断是否需要转换 → 写入 Hugo 目录
 * 3. 检测 Hugo 中多余的文件，返回列表供调用方确认删除
 *
 * @param app              Obsidian App 实例
 * @param sourceDir        源目录（vault 内相对路径）
 * @param hugoContentDir   Hugo content 目录（绝对路径）
 * @param convertNonPosts  非 posts 目录是否转换 wikilink
 * @param permalinkFormat  wikilink 转换后的 URL 格式
 * @param imageBaseURL     图片基础链接（为空则不转换图片）
 */
export async function syncAll(
	app: App,
	sourceDir: string,
	hugoContentDir: string,
	convertNonPosts: boolean,
	permalinkFormat: string,
	imageBaseURL: string
): Promise<SyncResult> {
	const errors: string[] = [];

	// Step 1: 构建 slug 映射表（始终构建，供 posts 转换用）
	const { slugMap, titleMap } = await buildSlugMaps(app, sourceDir);

	// Step 2: 获取源目录所有 .md 文件
	const sourceFiles = await listMdFiles(app, sourceDir);

	// 确保 Hugo content 根目录存在
	if (!fs.existsSync(hugoContentDir)) {
		fs.mkdirSync(hugoContentDir, { recursive: true });
	}

	// Step 3: 处理每个文件
	let updated = 0;
	const processedRelPaths = new Set<string>();

	for (const vaultPath of sourceFiles) {
		try {
			// 计算相对于 sourceDir 的路径
			const relPath = vaultPath.substring(sourceDir.length + 1); // +1 去掉开头的 /
			processedRelPaths.add(relPath);

			let content = await app.vault.adapter.read(vaultPath);

			// 判断是否需要转换 wikilink
			// — posts/ 目录永远转换
			// — 其他目录根据 convertNonPosts 设置决定
			const isPost = relPath.startsWith("posts/");
			const shouldConvert = isPost || convertNonPosts;

			if (shouldConvert) {
				content = transformWikilinks(content, slugMap, titleMap, permalinkFormat);
			}

			// 图片链接转换（独立于 wikilink 转换，所有文件统一处理）
			if (imageBaseURL) {
				content = transformImageLinks(content, imageBaseURL);
			}

			// 写入 Hugo 目录，保持目录结构镜像
			const dstPath = path.join(hugoContentDir, relPath);
			const dstDir = path.dirname(dstPath);
			fs.mkdirSync(dstDir, { recursive: true });
			fs.writeFileSync(dstPath, content, "utf-8");

			updated++;
		} catch (err) {
			errors.push(`${vaultPath}: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	// Step 4: 检测 Hugo 中多余的文件（源中已删除的）
	const hugoFiles = listHugoMdFiles(hugoContentDir);
	const extraFiles: string[] = [];

	for (const hugoPath of hugoFiles) {
		const relPath = path.relative(hugoContentDir, hugoPath);
		if (!processedRelPaths.has(relPath)) {
			extraFiles.push(relPath);
		}
	}

	return { updated, extraFiles, errors };
}

/**
 * 删除 Hugo 目录中多余的文件
 * @returns 实际删除的文件数
 */
export function deleteExtraFiles(
	hugoContentDir: string,
	extraFiles: string[]
): number {
	let deleted = 0;
	for (const relPath of extraFiles) {
		const fullPath = path.join(hugoContentDir, relPath);
		try {
			if (fs.existsSync(fullPath)) {
				fs.unlinkSync(fullPath);
				deleted++;

				// 清理空目录（向上递归）
				let dir = path.dirname(fullPath);
				while (dir !== hugoContentDir && dir.startsWith(hugoContentDir)) {
					try {
						const remaining = fs.readdirSync(dir);
						if (remaining.length === 0 || (remaining.length === 1 && remaining[0] === ".DS_Store")) {
							if (remaining.length === 1) fs.unlinkSync(path.join(dir, ".DS_Store"));
							fs.rmdirSync(dir);
							dir = path.dirname(dir);
						} else {
							break;
						}
					} catch {
						break;
					}
				}
			}
		} catch {
			// 删除失败，跳过
		}
	}
	return deleted;
}
