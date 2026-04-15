import {
	App,
	MarkdownView,
	MarkdownPostProcessorContext,
} from "obsidian";
import HomepageComponentPlugin from "./main";
import { parseHomepageConfig } from "./homepageConfig";
import { HomeboardError } from "./homeboardError";
import {
	DEFAULT_HOMEPAGE_SETTINGS,
	HomepageCardConfig,
	HomepageComponentSettings,
	HomepageConfig,
	HomepageLinkItem,
	resolveHomepageCardPalette,
} from "./homepageTypes";
import { convertToRGBA } from "./colorUtils";
import { mountFloatingEditButton } from "./view/codeblock/floatingEditButton";

const DEFAULT_GAP = "2px";

export class HomepageProcessor {
	private plugin: HomepageComponentPlugin;
	private settings: HomepageComponentSettings;

	constructor(plugin: HomepageComponentPlugin, settings: HomepageComponentSettings) {
		this.plugin = plugin;
		this.settings = settings;
	}

	async render(
		code: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		_app: App
		) {
			try {
				const config = this.parseConfig(code);
				await this.renderHomepage(config, code, el, ctx);
		} catch (error) {
			if (error instanceof HomeboardError) {
				this.renderErrorTips(el, error.summary, error.recommends);
				return;
			}

			console.error(error);
			this.renderErrorTips(el, "Homeboard 解析失败", [
				"请检查 YAML 格式、缩进和 cards 配置",
			]);
		}
	}

	private parseConfig(code: string): HomepageConfig {
		return parseHomepageConfig(code);
	}

	private async renderHomepage(
		config: HomepageConfig,
		code: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		el.empty();

		const wrapper = el.createDiv({ cls: "homeboard" });
		const sectionInfo = ctx.getSectionInfo?.(el);
		const columns = this.normalizeColumns(config.columns);
		const gap = this.normalizeGap(config.gap);
		const blockId = this.getBlockId(config, ctx, el);

		wrapper.style.setProperty("--homepage-columns", String(columns));
		wrapper.style.setProperty("--homepage-gap", gap);
		wrapper.style.setProperty(
			"--homepage-card-border-color",
			convertToRGBA(
				config.cardBorderColor ?? this.settings.cardBorderColor,
				config.cardBorderTransparency ?? this.settings.cardBorderTransparency
			)
		);
		wrapper.style.setProperty(
			"--homepage-resizer-color",
			this.settings.showResizers
				? convertToRGBA(
						config.resizerColor ?? this.settings.resizerColor,
						config.resizerTransparency ?? this.settings.resizerTransparency
				  )
				: "transparent"
		);
		this.renderEditButton(wrapper, ctx, sectionInfo?.lineStart, sectionInfo?.lineEnd, code);

		if (config.title) {
			const titleEl = wrapper.createEl("h2", {
				cls: "homeboard__title",
				text: config.title,
			});
			titleEl.style.fontSize = `${this.normalizeTitleFontSize(config.titleFontSize)}px`;
		} else {
			wrapper.addClass("homeboard--toolbar-only");
		}

		const shell = wrapper.createDiv({ cls: "homeboard__shell" });
		const grid = shell.createDiv({ cls: "homeboard__grid" });
		const cards = config.cards ?? [];
		const widths = this.loadColumnWidths(blockId, columns);
		this.applyGridTemplate(grid, widths);
		const isSourceMode =
			this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.getMode?.() === "source";

		for (const card of cards) {
			const cardEl = grid.createDiv({ cls: "homeboard__card" });
			const palette = resolveHomepageCardPalette(card);
			cardEl.dataset.type = "links";
			cardEl.style.gridColumn = `span ${this.normalizeSpan(card.span, columns)}`;
			cardEl.style.background = convertToRGBA(
				palette.background,
				card.cardBackgroundTransparency ?? 100
			);
			cardEl.style.setProperty("--homeboard-card-title-color", palette.title);
			cardEl.style.setProperty("--homeboard-card-link-color", palette.link);
			cardEl.style.setProperty("--homeboard-card-separator-color", palette.separator);

			const column = card.column;
			if (typeof column === "number" && column > 0 && column <= columns) {
				cardEl.style.gridColumnStart = String(card.column);
			}

			if (card.linksLayout) {
				cardEl.dataset.linksLayout = card.linksLayout;
			} else {
				cardEl.dataset.linksLayout = "inline";
			}

			if (card.title) {
				cardEl.createEl("h3", {
					cls: "homeboard__card-title",
					text: card.title,
				});
			}

			const body = cardEl.createDiv({ cls: "homeboard__card-body" });
			this.renderLinksCard(body, card, ctx.sourcePath);
		}

		if (isSourceMode) {
			this.mountResizers(shell, grid, widths, blockId);
		}
	}

	private normalizeColumns(columns?: number): number {
		if (!columns || Number.isNaN(columns)) {
			return this.settings.defaultColumns ?? DEFAULT_HOMEPAGE_SETTINGS.defaultColumns;
		}

		return Math.max(1, Math.min(4, Math.floor(columns)));
	}

	private normalizeSpan(span: number | undefined, columns: number): number {
		if (!span || Number.isNaN(span)) {
			return 1;
		}

		return Math.max(1, Math.min(columns, Math.floor(span)));
	}

	private normalizeGap(gap?: string | number): string {
		if (typeof gap === "number") {
			return `${gap}px`;
		}

		if (typeof gap === "string" && gap.trim()) {
			return gap;
		}

		return DEFAULT_GAP;
	}

	private normalizeTitleFontSize(fontSize?: number): number {
		if (!fontSize || Number.isNaN(fontSize)) {
			return 16;
		}

		return Math.max(12, Math.min(48, Math.floor(fontSize)));
	}

	private renderLinksCard(container: HTMLElement, card: HomepageCardConfig, sourcePath: string) {
		const links = card.links ?? [];
		if (card.linksLayout === "inline") {
			const nav = container.createDiv({ cls: "homeboard__links-inline" });
			links.forEach((link, index) => {
				const button = this.createLinkButton(nav, link);
				this.bindInternalLink(button, link, sourcePath);
				if (index < links.length - 1) {
					nav.createEl("span", {
						cls: "homeboard__links-inline-separator",
						text: "|",
					});
				}
			});
			return;
		}

		const list = container.createEl("ul", { cls: "homeboard__links" });
		for (const link of links) {
			const item = list.createEl("li");
			const button = this.createLinkButton(item, link);
			this.bindInternalLink(button, link, sourcePath);
		}
	}

	private createLinkButton(container: HTMLElement, link: HomepageLinkItem) {
		return container.createEl("button", {
			text: link.label,
			cls: "homeboard__link-button internal-link",
			attr: { type: "button" },
		});
	}

	private bindInternalLink(element: HTMLElement, link: HomepageLinkItem, sourcePath: string) {
		element.dataset.href = link.url;
		element.setAttribute("aria-label", link.label);

		let lastHandledAt = 0;
		const openLink = (event: Event) => {
			event.preventDefault();
			event.stopPropagation();

			const now = Date.now();
			if (now - lastHandledAt < 250) {
				return;
			}
			lastHandledAt = now;

			void this.plugin.app.workspace.openLinkText(link.url, sourcePath, false);
		};

		element.addEventListener("click", openLink);
		element.addEventListener("pointerup", openLink);
		element.addEventListener("touchend", openLink, { passive: false });
	}

	private renderEditButton(
		container: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		startLine: number | undefined,
		endLine: number | undefined,
		content: string
	) {
		if (startLine === undefined || endLine === undefined) {
			return;
		}

		const codeblockDom =
			container.parentElement?.parentElement ?? container.parentElement ?? container;
		mountFloatingEditButton({
			app: this.plugin.app,
			codeblockDom,
			className: "contribution-graph-codeblock-edit-button",
			iconName: "gantt-chart",
			onClick: () => {
				this.plugin.openBuilderForBlock(ctx.sourcePath, startLine, endLine, content);
			},
		});
	}

	private getBlockId(
		config: HomepageConfig,
		ctx: MarkdownPostProcessorContext,
		el: HTMLElement
	): string {
		if (config.id) {
			return config.id;
		}

		const lineStart = ctx.getSectionInfo?.(el)?.lineStart ?? 0;
		return `${ctx.sourcePath}::${lineStart}`;
	}

	private getWidthsStorageKey(blockId: string): string {
		return `homeboard-widths-${blockId}`;
	}

	private loadColumnWidths(blockId: string, columns: number): number[] {
		const storageKey = this.getWidthsStorageKey(blockId);
		const stored = this.plugin.app.loadLocalStorage(storageKey);
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as number[];
				if (Array.isArray(parsed) && parsed.length === columns) {
					const sum = parsed.reduce((acc, value) => acc + value, 0);
					if (sum > 0) {
						return parsed;
					}
				}
			} catch (error) {
				console.warn("Failed to parse homepage widths", error);
			}
		}

		return Array.from({ length: columns }, () => 100 / columns);
	}

	private saveColumnWidths(blockId: string, widths: number[]) {
		this.plugin.app.saveLocalStorage(this.getWidthsStorageKey(blockId), JSON.stringify(widths));
	}

	private applyGridTemplate(grid: HTMLElement, widths: number[]) {
		grid.style.gridTemplateColumns = widths.map((value) => `${value}%`).join(" ");
	}

	private mountResizers(
		shell: HTMLElement,
		grid: HTMLElement,
		initialWidths: number[],
		blockId: string
	) {
		if (!this.settings.showResizers || initialWidths.length <= 1) {
			return;
		}

		let widths = [...initialWidths];
		const resizers: HTMLElement[] = [];
		const minWidth = this.settings.minColumnWidthPercent ?? DEFAULT_HOMEPAGE_SETTINGS.minColumnWidthPercent;

		const syncResizers = () => {
			let cumulative = 0;
			resizers.forEach((resizer, index) => {
				cumulative += widths[index];
				resizer.style.left = `calc(${cumulative}% - var(--homepage-resizer-width, 4px) / 2)`;
			});
			this.applyGridTemplate(grid, widths);
		};

		for (let index = 0; index < widths.length - 1; index++) {
			const resizer = shell.createDiv({ cls: "homeboard__resizer" });
			resizer.dataset.index = String(index);
			resizers.push(resizer);

			let startX = 0;
			let leftWidth = 0;
			let rightWidth = 0;

			const onMouseMove = (event: MouseEvent) => {
				const shellWidth = shell.getBoundingClientRect().width;
				if (shellWidth <= 0) {
					return;
				}

				const deltaPercent = ((event.clientX - startX) / shellWidth) * 100;
				const nextLeft = leftWidth + deltaPercent;
				const nextRight = rightWidth - deltaPercent;
				if (nextLeft < minWidth || nextRight < minWidth) {
					return;
				}

				widths[index] = nextLeft;
				widths[index + 1] = nextRight;
				syncResizers();
			};

			const onMouseUp = () => {
				document.body.classList.remove("cursor-col-resize");
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
				this.saveColumnWidths(blockId, widths);
			};

			resizer.addEventListener("mousedown", (event) => {
				startX = event.clientX;
				leftWidth = widths[index];
				rightWidth = widths[index + 1];
				document.body.classList.add("cursor-col-resize");
				document.addEventListener("mousemove", onMouseMove);
				document.addEventListener("mouseup", onMouseUp);
				event.preventDefault();
			});
		}

		syncResizers();
	}

	private renderErrorTips(container: HTMLElement, summary: string, recommends?: string[]) {
		container.empty();
		const errDiv = container.createDiv({ cls: "homeboard-render-error-container" });
		errDiv.createEl("p", {
			text: summary,
			cls: "summary",
		});
		recommends?.forEach((recommend) => {
			errDiv.createEl("pre", {
				text: recommend,
				cls: "recommend",
			});
		});
	}
}
