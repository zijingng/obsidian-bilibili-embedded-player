import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { EditorExtensions } from "editor-enhancements";

// Remember to rename these classes and interfaces!

interface PlayerPluginSettings {
	enhanceDefaultPaste: boolean;
	enableAutoPlay: boolean;
	enableDanmaku: boolean;
}

interface PasteFunction {
	(this: HTMLElement, ev: ClipboardEvent): void;
}

const DEFAULT_SETTINGS: PlayerPluginSettings = {
	enhanceDefaultPaste: true,
	enableAutoPlay: false,
	enableDanmaku: true
}

export default class PlayerPlugin extends Plugin {
	settings: PlayerPluginSettings;
	pasteFunction: PasteFunction;

	async onload() {
		await this.loadSettings();

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'convert-bilibili-url',
			name: 'Convert Bilibili URL to Embedded Player',
			editorCallback: (editor) => this.convertUrlToPlayer(editor),
			hotkeys: [
				{
				modifiers: ["Mod", "Shift"],
				key: "b",
				},
			],
		});

		this.pasteFunction = this.pasteUrlToPlayer.bind(this);
		this.registerEvent(
			this.app.workspace.on("editor-paste", this.pasteFunction)
		);


		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new PlayerSettingTab(this.app, this));

	}

	convertUrlToPlayer(editor: Editor): void {
		let selectedText = (EditorExtensions.getSelectedText(editor) || "").trim();

		let bvidRegex = /(?<=\/video\/)[a-zA-z0-9]+/gi;
		let match = selectedText.match(bvidRegex);
		if (match === null) return;
		let bvid = match[0];

		let p = "1";
		let pRegex = /(?<=\?p\=)[0-9]+/gi;
		match = selectedText.match(pRegex);
		if (match !== null) p = match[0];

		let danmaku = this.settings.enableDanmaku ? "1" : "0";
		let autoplay = this.settings.enableAutoPlay ? "1" : "0";

		let playerText = `<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;"><iframe src="https://player.bilibili.com/player.html?bvid=${bvid}&p=${p}&autoplay=${autoplay}&danmaku=${danmaku}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;"> </iframe></div>\n`;
		
		editor.replaceSelection(playerText);
		//editor.
	}
	
	async pasteUrlToPlayer(clipboard: ClipboardEvent, editor: Editor): Promise<void> {
		if (!this.settings.enhanceDefaultPaste) {
			return;
		}
	
		if (clipboard.clipboardData === null) return;
		let clipboardText = clipboard.clipboardData.getData("text/plain");
		if (clipboardText === null || clipboardText === "") return;
		
		let lineRegex = /(https?:\/\/(?:www\.|(?!www))bilibili\.[^\s]{2,}|www\.bilibili\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))bilibili\.[^\s]{2,}|www\.bilibili\.[^\s]{2,})/gi
		let urlsInLine = clipboardText.match(lineRegex);
		if (urlsInLine === null) return;

		let bvidRegex = /(?<=\/video\/)[a-zA-z0-9]+/gi;
		let match = clipboardText.match(bvidRegex);
		if (match === null) return;
		let bvid = match[0];

		// We've decided to handle the paste, stop propagation to the default handler.
		clipboard.stopPropagation();
		clipboard.preventDefault();

		let p = "1";
		let pRegex = /(?<=\?p\=)[0-9]+/gi;
		match = clipboardText.match(pRegex);
		if (match !== null) p = match[0];

		let danmaku = this.settings.enableDanmaku ? "1" : "0";
		let autoplay = this.settings.enableAutoPlay ? "1" : "0";

		let playerText = `<div style="position: relative; width: 100%; height: 0; padding-bottom: 75%;"><iframe src="https://player.bilibili.com/player.html?bvid=${bvid}&p=${p}&autoplay=${autoplay}&danmaku=${danmaku}" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="position: absolute; width: 100%; height: 100%; left: 0; top: 0;"> </iframe></div>\n`;
		
		editor.replaceSelection(playerText);
		return;
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}


class PlayerSettingTab extends PluginSettingTab {
	plugin: PlayerPlugin;

	constructor(app: App, plugin: PlayerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('开启粘贴强化')
			.setDesc('支持将复制的视频链接转换为嵌入式播放器')
			.addToggle((val) =>
				val
				.setValue(this.plugin.settings.enhanceDefaultPaste)
				.onChange(async (value) => {
				console.log(value);
				this.plugin.settings.enhanceDefaultPaste = value;
				await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
		.setName('开启弹幕')
		.setDesc('开启嵌入式播放器的弹幕功能')
		.addToggle((val) =>
			val
			.setValue(this.plugin.settings.enableDanmaku)
			.onChange(async (value) => {
			console.log(value);
			this.plugin.settings.enableDanmaku = value;
			await this.plugin.saveSettings();
			}));

		new Setting(containerEl)
		.setName('开启自动播放')
		.setDesc('开启嵌入式播放器的自动播放功能')
		.addToggle((val) =>
			val
			.setValue(this.plugin.settings.enableAutoPlay)
			.onChange(async (value) => {
			console.log(value);
			this.plugin.settings.enableAutoPlay = value;
			await this.plugin.saveSettings();
			}));
	}
}
