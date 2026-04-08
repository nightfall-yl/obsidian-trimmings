import { App, PluginSettingTab, Setting } from "obsidian";
import HomepageComponentPlugin from "./main";
import {
	DEFAULT_HOMEPAGE_SETTINGS,
	HomepageComponentSettings,
} from "./homepageTypes";
import { convertToRGBA } from "./colorUtils";

export function applyHomepageStyles(settings: HomepageComponentSettings) {
	const rootStyle = document.documentElement.style;
	rootStyle.setProperty("--homepage-card-padding", `${settings.cardPadding}px`);
	rootStyle.setProperty("--homepage-card-radius", `${settings.cardBorderRadius}px`);
	rootStyle.setProperty(
		"--homepage-card-border-color",
		convertToRGBA(settings.cardBorderColor, settings.cardBorderTransparency)
	);
	rootStyle.setProperty("--homepage-resizer-width", `${settings.resizerWidth}px`);
	rootStyle.setProperty(
		"--homepage-resizer-color",
		settings.showResizers
			? convertToRGBA(settings.resizerColor, settings.resizerTransparency)
			: "transparent"
	);
}

export class HomepageSettingTab extends PluginSettingTab {
	plugin: HomepageComponentPlugin;

	constructor(app: App, plugin: HomepageComponentPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
	}
}
