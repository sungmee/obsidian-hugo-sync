import { App, PluginSettingTab, Setting } from "obsidian";
import type HugoPublishPlugin from "./main";

// ============================================================
// 设置接口
// ============================================================

export interface HugoPublishSettings {
	/** vault 内的 Hugo 源目录（相对于 vault 根） */
	sourceDir: string;
	/** Hugo 项目的 content 目录（绝对路径） */
	hugoContentDir: string;
	/** 非 posts 目录（about/archives/tags 等）是否转换双链 */
	convertNonPostsWikilinks: boolean;
	/** wikilink 转换后的永久链接格式，`:slug` 将被替换为实际 slug */
	permalinkFormat: string;
	/** 图片基础链接，用于转换 ![[image.png]]。为空则不转换图片链接 */
	imageBaseURL: string;
	/** 是否启用文件监听自动同步 */
	watchEnabled: boolean;
	/** 文件变更防抖间隔（秒） */
	debounceSeconds: number;
}

export const DEFAULT_SETTINGS: HugoPublishSettings = {
	sourceDir: "",
	hugoContentDir: "",
	convertNonPostsWikilinks: false,
	permalinkFormat: "/:slug/",
	imageBaseURL: "",
	watchEnabled: true,
	debounceSeconds: 10,
};

// ============================================================
// 设置 Tab UI
// ============================================================

export class HugoPublishSettingTab extends PluginSettingTab {
	plugin: HugoPublishPlugin;

	constructor(app: App, plugin: HugoPublishPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// === 源目录 ===
		new Setting(containerEl)
			.setName("源目录")
			.setDesc("Obsidian vault 中的 Hugo 文章源目录（相对路径），例如 50-output/lxooo.com")
			.addText((text) =>
				text
					.setPlaceholder("50-output/lxooo.com")
					.setValue(this.plugin.settings.sourceDir)
					.onChange(async (value) => {
						this.plugin.settings.sourceDir = value.trim();
						await this.plugin.saveSettings();
					})
			);

		// === Hugo content 目录 ===
		new Setting(containerEl)
			.setName("Hugo content 目录")
			.setDesc("Hugo 项目的 content 目录绝对路径")
			.addText((text) =>
				text
					.setPlaceholder("/Users/xxx/Projects/com.lxooo/content")
					.setValue(this.plugin.settings.hugoContentDir)
					.onChange(async (value) => {
						this.plugin.settings.hugoContentDir = value.trim();
						await this.plugin.saveSettings();
					})
			);

		// === 双链转换（非 posts） ===
		new Setting(containerEl)
			.setName("非 posts 目录双链转换")
			.setDesc(
				"开启后，about/archives/tags 等非 posts 目录下的 .md 文件也会转换 wikilink。" +
				"posts/ 目录永远转换，不受此开关影响。"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.convertNonPostsWikilinks)
					.onChange(async (value) => {
						this.plugin.settings.convertNonPostsWikilinks = value;
						await this.plugin.saveSettings();
					})
			);

		// === 永久链接格式 ===
		new Setting(containerEl)
			.setName("永久链接格式")
			.setDesc(
				"wikilink 转换后的 URL 格式。:slug 会被替换为文章的实际 slug。" +
				"默认 /:slug/ 匹配 Hugo uglyURLs=false 的输出。" +
				"例如 /posts/:slug.html 或 /:year/:slug/"
			)
			.addText((text) =>
				text
					.setPlaceholder("/:slug/")
					.setValue(this.plugin.settings.permalinkFormat)
					.onChange(async (value) => {
						this.plugin.settings.permalinkFormat = value.trim() || "/:slug/";
						await this.plugin.saveSettings();
					})
			);

		// === 图片基础链接 ===
		new Setting(containerEl)
			.setName("图片基础链接")
			.setDesc(
				"将 Obsidian 图片嵌入 ![[image.png]] 转换为标准 Markdown 图片链接。" +
				"配置后，所有已同步文件中的图片嵌入都会被转换。留空则不转换。"
			)
			.addText((text) =>
				text
					.setPlaceholder("https://cdn.example.com/images")
					.setValue(this.plugin.settings.imageBaseURL)
					.onChange(async (value) => {
						this.plugin.settings.imageBaseURL = value.trim();
						await this.plugin.saveSettings();
					})
			);

		// === 监听开关 ===
		new Setting(containerEl)
			.setName("文件监听")
			.setDesc(
				"开启后，源目录文件变更时自动同步。关闭后需手动点击按钮触发同步。"
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.watchEnabled)
					.onChange(async (value) => {
						this.plugin.settings.watchEnabled = value;
						await this.plugin.saveSettings();
						// 重新应用监听状态
						this.plugin.applyWatchMode();
					})
			);

		// === 防抖间隔 ===
		new Setting(containerEl)
			.setName("防抖间隔（秒）")
			.setDesc("文件变更后等待多少秒无新变更才触发同步。仅在监听开启时生效。")
			.addSlider((slider) =>
				slider
					.setLimits(1, 60, 1)
					.setValue(this.plugin.settings.debounceSeconds)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.debounceSeconds = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
