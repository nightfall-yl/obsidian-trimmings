import { App, MarkdownView, Notice } from "obsidian";
import { ContributionGraphCreateModal } from "../form/GraphFormModal";
import { mountFloatingEditButton } from "./floatingEditButton";
import { Locals } from "src/i18/messages";

export function mountEditButtonToCodeblock(
	app: App,
	code: string,
	codeblockDom: HTMLElement
) {
	let currentCode = code;
	let currentStart: number | null = null;

	return mountFloatingEditButton({
		app,
		codeblockDom,
		className: "contribution-graph-codeblock-edit-button",
		iconName: "gantt-chart",
		onClick: () => {
			new ContributionGraphCreateModal(app, currentCode, (content) => {
				const markdownView =
					app.workspace.getActiveViewOfType(MarkdownView);
				if (!markdownView) {
					new Notice(Locals.get().notice_heatmap_no_markdown_view);
					return;
				}
				const editor = markdownView.editor;
				const editorView = (editor as typeof editor & {
					cm?: {
						posAtDOM?: (dom: HTMLElement) => number;
						dispatch?: (spec: {
							changes: { from: number; to: number; insert: string };
						}) => void;
					};
				}).cm;
				if (!editorView?.posAtDOM || !editorView.dispatch) {
					new Notice(Locals.get().notice_heatmap_editor_unsupported);
					return;
				}
				if (currentStart == null) {
					const pos = editorView.posAtDOM(codeblockDom);
					currentStart = pos + "```contributionGraph\n".length;
				}
				editorView.dispatch({
					changes: {
						from: currentStart,
						to: currentStart + (currentCode ? currentCode.length : 0),
						insert: content,
					},
				});
				currentCode = content;
			}).open();
		},
	});
}
