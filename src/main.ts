import {
	Editor,
	MarkdownFileInfo,
	MarkdownView,
	Menu,
	Notice,
	Plugin,
	TFile,
	setIcon,
} from "obsidian";
import { HomepageBuilderModal } from "./builderModal";
import { Locals } from "./i18/messages";
import { parseHomepageConfig } from "./homepageConfig";
import { HomeboardError } from "./homeboardError";
import { HomepageProcessor } from "./homepageProcessor";
import { DEFAULT_HOMEPAGE_SETTINGS, HomepageComponentSettings } from "./homepageTypes";
import { stringifyHomepageConfig } from "./homepageYaml";
import { CodeBlockProcessor } from "./processor/codeBlockProcessor";
import { Renders } from "./render/renders";
import { applyHomepageStyles } from "./settings";
import { ContributionGraphConfig } from "./types";
import { mountEditButtonToCodeblock } from "./view/codeblock/CodeblockEditButtonMount";
import { ContributionGraphCreateModal } from "./view/form/GraphFormModal";
import "../styles.css";

declare global {
	interface Window {
		renderContributionGraph?: (
			container: HTMLElement,
			graphConfig: ContributionGraphConfig
		) => void;
	}
}

const HOMEPAGE_SAMPLE = String.raw`title: My Homepage
columns: 2
gap: 16
cards:
  - type: links
    title: CODE信息管理
    span: 1
    linksLayout: inline
    links:
      - label: 收件箱
        url: 00.收件箱-Index
      - label: 快速捕获
        url: QuickCap
      - label: 日记
        url: 00.Daily Index
      - label: 书架
        url: WeRead.base
  - type: links
    title: PARA组织管理
    span: 1
    linksLayout: inline
    links:
      - label: 项目
        url: 00.项目 Index
      - label: 领域
        url: 00.领域 Index
      - label: 资源
        url: 00.资源 Index
      - label: 归档
        url: 00.归档 Index
`;

export default class HomepageComponentPlugin extends Plugin {
	settings: HomepageComponentSettings;

	async onload() {
		await this.loadSettings();
		applyHomepageStyles(this.settings);
		this.registerGlobalRenderApi();

		this.registerMarkdownCodeBlockProcessor("contributionGraph", (code, el, ctx) => {
			const processor = new CodeBlockProcessor();
			processor.renderFromCodeBlock(code, el, ctx, this.app);
			if (el.parentElement) {
				mountEditButtonToCodeblock(this.app, code, el.parentElement);
			}
		});

		this.registerMarkdownCodeBlockProcessor("homeboard", async (source, el, ctx) => {
			const processor = new HomepageProcessor(this, this.settings);
			await processor.render(source, el, ctx, this.app);
		});

		this.addCommand({
			id: "insert-homeboard-block",
			name: Locals.get().homeboard_insert_command,
			editorCallback: (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) => {
				editor.replaceSelection(`\`\`\`homeboard\n${HOMEPAGE_SAMPLE}\n\`\`\`\n`);
			},
		});

		this.addCommand({
			id: "open-homeboard-builder",
			name: Locals.get().homeboard_builder_command,
			callback: () => {
				this.openBuilder();
			},
		});

		this.addCommand({
			id: "edit-homeboard-block-at-cursor",
			name: Locals.get().homeboard_edit_command,
			editorCallback: (editor: Editor, _ctx: MarkdownView | MarkdownFileInfo) => {
				this.editHomeboardBlockAtCursor(editor);
			},
		});

		this.addCommand({
			id: "create-contribution-graph",
			name: Locals.get().context_menu_create,
			editorCallback: () => {
				this.openContributionGraphModal();
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor, _info) => {
				menu.setUseNativeMenu(false);
				menu.addItem((item) =>
					item
						.setTitle(Locals.get().homeboard_menu_title)
						.setIcon("lucide-layout-template")
						.onClick(() => {})
				);
				window.setTimeout(() => {
					this.attachHomeboardSubmenuHover(menu, editor);
				}, 0);
			})
		);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_HOMEPAGE_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private registerGlobalRenderApi() {
		window.renderContributionGraph = (
			container: HTMLElement,
			graphConfig: ContributionGraphConfig
		): void => {
			Renders.render(container, graphConfig);
		};
	}

	private insertHomeboardBlock(editor: Editor) {
		editor.replaceSelection(`\`\`\`homeboard\n${HOMEPAGE_SAMPLE}\n\`\`\`\n`);
	}

	private openContributionGraphModal() {
		new ContributionGraphCreateModal(this.app).open();
	}

	private attachHomeboardSubmenuHover(menu: Menu, editor: Editor) {
		const local = Locals.get();
		const menus = Array.from(document.querySelectorAll<HTMLElement>(".menu"));
		const currentMenuEl = menus.at(-1);
		if (!currentMenuEl) {
			return;
		}

		const menuItemEl = Array.from(currentMenuEl.querySelectorAll<HTMLElement>(".menu-item")).find(
			(itemEl) => itemEl.textContent?.includes(local.homeboard_menu_title)
		);
		if (!menuItemEl || menuItemEl.dataset.homeboardSubmenuBound === "true") {
			return;
		}

		menuItemEl.dataset.homeboardSubmenuBound = "true";
		menuItemEl.addClass("homeboard-menu-item--has-submenu");

		const titleEl = menuItemEl.querySelector<HTMLElement>(".menu-item-title");
		if (titleEl && !titleEl.querySelector(".homeboard-menu-item__chevron")) {
			titleEl.createSpan({
				cls: "homeboard-menu-item__chevron",
				text: "›",
			});
		}

		let submenuEl: HTMLElement | null = null;
		let hideTimer: number | null = null;
		let pointerInsideSubmenu = false;

		const clearHideTimer = () => {
			if (hideTimer !== null) {
				window.clearTimeout(hideTimer);
				hideTimer = null;
			}
		};

		const scheduleHide = () => {
			clearHideTimer();
			hideTimer = window.setTimeout(() => {
				if (!pointerInsideSubmenu) {
					submenuEl?.remove();
					submenuEl = null;
				}
			}, 120);
		};

		const runMenuInsert = (insert: () => void) => {
			submenuEl?.remove();
			submenuEl = null;
			menu.hide();
			window.setTimeout(() => {
				editor.focus();
				insert();
			}, 0);
		};

		const createSubmenuItem = (title: string, icon: string, onClick: () => void) => {
			const itemEl = createDiv({ cls: "menu-item homeboard-hover-submenu__item" });
			const iconEl = itemEl.createDiv({ cls: "menu-item-icon" });
			setIcon(iconEl, icon);
			itemEl.createDiv({ cls: "menu-item-title", text: title });
			itemEl.addEventListener("mousedown", (evt) => {
				evt.preventDefault();
				evt.stopPropagation();
				runMenuInsert(onClick);
			});
			return itemEl;
		};

		const showSubmenu = () => {
			clearHideTimer();
			if (submenuEl) {
				return;
			}

			const menuRect = currentMenuEl.getBoundingClientRect();
			const rect = menuItemEl.getBoundingClientRect();
			submenuEl = createDiv({ cls: "menu homeboard-hover-submenu" });
			submenuEl.style.left = `${menuRect.right - 10}px`;
			submenuEl.style.top = `${rect.top - 10}px`;
			submenuEl.appendChild(
				createSubmenuItem(local.context_menu_create, "lucide-chart-no-axes-combined", () => {
					this.openContributionGraphModal();
				})
			);
			submenuEl.appendChild(
				createSubmenuItem(local.homeboard_menu_insert, "lucide-columns-2", () => {
					this.insertHomeboardBlock(editor);
				})
			);
			document.body.appendChild(submenuEl);
			submenuEl.addEventListener("mouseenter", () => {
				pointerInsideSubmenu = true;
				clearHideTimer();
			});
			submenuEl.addEventListener("mouseleave", () => {
				pointerInsideSubmenu = false;
				scheduleHide();
			});
		};

		menuItemEl.addEventListener("mouseenter", showSubmenu);
		menuItemEl.addEventListener("mouseleave", () => {
			pointerInsideSubmenu = false;
			scheduleHide();
		});
		menu.onHide(() => {
			clearHideTimer();
			submenuEl?.remove();
			submenuEl = null;
		});
	}

	openBuilder() {
		const view = this.getActiveMarkdownView();
		if (!view?.file?.path) {
			new Notice(Locals.get().notice_open_markdown_first);
			return;
		}

		const editor = view.editor;
		const start = editor.getCursor("from");
		const initialConfig = HomepageBuilderModal.createInitialConfig(this.settings);
		const codeBlock = HomepageBuilderModal.toCodeBlock(initialConfig);
		editor.replaceSelection(codeBlock);
		const insertedLines = this.countBlockLines(codeBlock);
		this.openBuilderForBlock(
			view.file.path,
			start.line,
			start.line + insertedLines - 1,
			stringifyHomepageConfig(initialConfig)
		);
	}

	private getActiveMarkdownView() {
		return this.app.workspace.getActiveViewOfType(MarkdownView);
	}

	private countBlockLines(codeBlock: string) {
		return codeBlock.trimEnd().split("\n").length;
	}

	openBuilderForBlock(
		sourcePath: string,
		startLine: number,
		endLine: number,
		content: string
	) {
		this.openBuilderModal(sourcePath, startLine, endLine, content);
	}

	private openBuilderModal(
		sourcePath: string,
		startLine: number,
		endLine: number,
		content: string
	) {
		try {
			const config = parseHomepageConfig(content);
			new HomepageBuilderModal(
				this.app,
				this.settings,
				async (nextConfig) => {
					try {
						await this.replaceBlockInFile(
							sourcePath,
							startLine,
							endLine,
							HomepageBuilderModal.toCodeBlock(nextConfig)
						);
					} catch (error) {
						console.error(error);
						new Notice(Locals.get().notice_homeboard_update_failed);
					}
				},
				config
			).open();
		} catch (error) {
			if (error instanceof HomeboardError) {
				new Notice(error.summary);
				return;
			}

			console.error(error);
			new Notice(Locals.get().notice_homeboard_parse_failed);
		}
	}

	private editHomeboardBlockAtCursor(editor: Editor) {
		const block = this.findHomeboardBlockAtCursor(editor);
		if (!block) {
			new Notice(Locals.get().notice_homeboard_cursor_required);
			return;
		}

		try {
			const view = this.getActiveMarkdownView();
			const sourcePath = view?.file?.path;
			if (!sourcePath) {
				throw new Error(Locals.get().notice_no_active_markdown_file);
			}
			this.openBuilderModal(
				sourcePath,
				block.startLine,
				block.endLine,
				block.content
			);
		} catch (error) {
			if (error instanceof HomeboardError) {
				new Notice(error.summary);
				return;
			}

			console.error(error);
			new Notice(Locals.get().notice_homeboard_parse_failed);
		}
	}

	private findHomeboardBlockAtCursor(editor: Editor) {
		const cursorLine = editor.getCursor().line;
		let startLine = -1;
		for (let line = cursorLine; line >= 0; line--) {
			const current = editor.getLine(line).trim();
			if (current.startsWith("```homeboard")) {
				startLine = line;
				break;
			}
			if (current.startsWith("```") && !current.startsWith("```homeboard")) {
				return null;
			}
		}

		if (startLine === -1) {
			return null;
		}

		let endLine = -1;
		const lastLine = editor.lineCount();
		for (let line = startLine + 1; line < lastLine; line++) {
			if (editor.getLine(line).trim() === "```") {
				endLine = line;
				break;
			}
		}

		if (endLine === -1 || cursorLine > endLine) {
			return null;
		}

		const contentLines: string[] = [];
		for (let line = startLine + 1; line < endLine; line++) {
			contentLines.push(editor.getLine(line));
		}

		return {
			startLine,
			endLine,
			content: contentLines.join("\n"),
		};
	}

	private async replaceBlockInFile(
		sourcePath: string,
		startLine: number,
		endLine: number,
		replacement: string
	) {
		const file = this.app.vault.getAbstractFileByPath(sourcePath);
		if (!(file instanceof TFile)) {
			throw new Error(`File not found: ${sourcePath}`);
		}

		const original = await this.app.vault.cachedRead(file);
		const hasTrailingNewline = original.endsWith("\n");
		const lines = original.split("\n");
		if (hasTrailingNewline) {
			lines.pop();
		}

		let resolvedEndLine = endLine;
		if (startLine >= 0 && startLine < lines.length && lines[startLine]?.trim().startsWith("```")) {
			for (let line = startLine + 1; line < lines.length; line++) {
				if (lines[line]?.trim() === "```") {
					resolvedEndLine = line;
					break;
				}
			}
		}

		const replacementLines = replacement.trimEnd().split("\n");
		lines.splice(startLine, resolvedEndLine - startLine + 1, ...replacementLines);

		const nextContent = `${lines.join("\n")}${hasTrailingNewline ? "\n" : ""}`;
		await this.app.vault.modify(file, nextContent);
	}
}
