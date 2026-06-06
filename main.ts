import { EventRef, Modal, Notice, Plugin, TAbstractFile } from "obsidian";
import {
	DEFAULT_SETTINGS,
	HugoPublishSettings,
	HugoPublishSettingTab,
} from "./settings";
import { deleteExtraFiles, syncAll } from "./sync-engine";

// ============================================================
// 删除确认对话框
// ============================================================

class DeleteConfirmModal extends Modal {
	private extraFiles: string[];
	private onConfirm: () => void;

	constructor(app: Plugin["app"], extraFiles: string[], onConfirm: () => void) {
		super(app);
		this.extraFiles = extraFiles;
		this.onConfirm = onConfirm;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h3", { text: "检测到多余文件" });

		const infoEl = contentEl.createEl("p");
		infoEl.createEl("strong", {
			text: `Hugo content 中有 ${this.extraFiles.length} 个文件在源目录中已不存在：`,
		});

		const list = contentEl.createEl("ul", { cls: "hugo-sync-delete-list" });
		// 最多显示 20 个文件，避免列表过长
		const displayFiles = this.extraFiles.slice(0, 20);
		for (const file of displayFiles) {
			list.createEl("li", { text: file });
		}
		if (this.extraFiles.length > 20) {
			list.createEl("li", {
				text: `... 以及其他 ${this.extraFiles.length - 20} 个文件`,
			});
		}

		contentEl.createEl("p", { text: "是否从 Hugo content 目录中删除这些文件？" });

		const buttonRow = contentEl.createDiv({ cls: "hugo-sync-buttons" });
		buttonRow.style.display = "flex";
		buttonRow.style.justifyContent = "flex-end";
		buttonRow.style.gap = "8px";
		buttonRow.style.marginTop = "16px";

		buttonRow.createEl("button", { text: "取消" }, (el) => {
			el.addEventListener("click", () => this.close());
		});

		buttonRow.createEl("button", { text: "删除", cls: "mod-warning" }, (el) => {
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
}

// ============================================================
// 插件主类
// ============================================================

export default class HugoPublishPlugin extends Plugin {
	settings: HugoPublishSettings = DEFAULT_SETTINGS;

	/** 防抖定时器 */
	private debounceTimer: ReturnType<typeof setTimeout> | null = null;
	/** 是否正在同步（防止并发） */
	private syncing = false;
	/** 文件监听事件引用（用于动态注销） */
	private watchEventRefs: EventRef[] = [];

	// ==========================================================
	// 生命周期
	// ==========================================================

	async onload() {
		await this.loadSettings();

		// Ribbon 图标（左侧边栏）
		this.addRibbonIcon("folder-sync", "Hugo 同步", () => this.doSync());

		// 命令面板
		this.addCommand({
			id: "hugo-sync",
			name: "同步到 Hugo",
			callback: () => this.doSync(),
		});

		// 设置 Tab
		this.addSettingTab(new HugoPublishSettingTab(this.app, this));

		// 启动监听
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

	private startWatch() {
		const { sourceDir } = this.settings;
		if (!sourceDir) return;

		/** 判断文件是否在源目录内 */
		const isInSourceDir = (filePath: string): boolean => {
			return filePath === sourceDir || filePath.startsWith(sourceDir + "/");
		};

		/** 文件变更回调（创建 / 修改） */
		const onChange = (file: TAbstractFile) => {
			if (this.syncing) return;
			if (isInSourceDir(file.path)) {
				this.debouncedSync();
			}
		};

		/** 文件删除回调 */
		const onDelete = (file: TAbstractFile) => {
			if (this.syncing) return;
			if (isInSourceDir(file.path)) {
				this.debouncedSync();
			}
		};

		// 注册事件并保存引用
		this.watchEventRefs.push(
			this.app.vault.on("modify", onChange),
			this.app.vault.on("create", onChange),
			this.app.vault.on("delete", onDelete)
		);
	}

	private clearWatch() {
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
	private debouncedSync() {
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			this.doSync();
		}, this.settings.debounceSeconds * 1000);
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
			imageBaseURL,
		} = this.settings;

		// 配置校验
		if (!sourceDir) {
			new Notice("❌ 请先在设置中配置「源目录」");
			return;
		}
		if (!hugoContentDir) {
			new Notice("❌ 请先在设置中配置「Hugo content 目录」");
			return;
		}

		if (this.syncing) {
			new Notice("⏳ 同步正在进行中，请稍候...");
			return;
		}

		this.syncing = true;
		const notice = new Notice("🔄 正在同步...", 0);

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

			// 报告错误
			if (result.errors.length > 0) {
				console.warn("Hugo Sync 错误:", result.errors);
				new Notice(`⚠️ ${result.updated} 篇已同步，${result.errors.length} 个错误（查看控制台）`, 6000);
			}

			// 处理多余文件
			if (result.extraFiles.length > 0) {
				new DeleteConfirmModal(
					this.app,
					result.extraFiles,
					() => {
						const deleted = deleteExtraFiles(hugoContentDir, result.extraFiles);
						new Notice(
							`✅ 同步完成：${result.updated} 篇已更新，${deleted} 篇已删除` +
							(result.errors.length > 0 ? `，${result.errors.length} 个错误` : ""),
							6000
						);
					}
				).open();
			} else {
				new Notice(
					`✅ 同步完成：${result.updated} 篇已更新` +
					(result.errors.length > 0 ? `，${result.errors.length} 个错误` : ""),
					4000
				);
			}
		} catch (err) {
			notice.hide();
			const msg = err instanceof Error ? err.message : String(err);
			console.error("Hugo Sync 异常:", err);
			new Notice(`❌ 同步失败：${msg}`, 8000);
		} finally {
			this.syncing = false;
		}
	}
}
