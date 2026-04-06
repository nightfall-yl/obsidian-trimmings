import { App, MarkdownView, getIcon } from "obsidian";

interface FloatingEditButtonOptions {
	app: App;
	codeblockDom: HTMLElement;
	className: string;
	iconName: string;
	canShow?: () => boolean;
	onClick: () => void;
}

export function mountFloatingEditButton(options: FloatingEditButtonOptions) {
	const { app, codeblockDom, className, iconName, canShow, onClick } = options;
	const classTokens = className.split(/\s+/).filter(Boolean);
	const primaryClassName = classTokens[0];
	if (primaryClassName) {
		codeblockDom.querySelectorAll(`.${primaryClassName}`).forEach((existing) => existing.remove());
	}

	const editButton = document.createElement("div");
	editButton.className = className;
	const iconEl = getIcon(iconName);
	if (iconEl) {
		editButton.appendChild(iconEl);
	}

	const nativeEditButton = findNativeEditButton(codeblockDom);
	let hideTimer: number | null = null;

	const clearHideTimer = () => {
		if (hideTimer !== null) {
			window.clearTimeout(hideTimer);
			hideTimer = null;
		}
	};

	const showButton = () => {
		clearHideTimer();
		const markdownView = app.workspace.getActiveViewOfType(MarkdownView);
		if (markdownView && markdownView.getMode() !== "preview" && (!canShow || canShow())) {
			justifyTop(codeblockDom, editButton);
			editButton.style.opacity = "1";
		}
	};

	const hideButton = () => {
		clearHideTimer();
		hideTimer = window.setTimeout(() => {
			editButton.style.opacity = "0";
		}, 120);
	};

	codeblockDom.addEventListener("mouseenter", showButton);
	codeblockDom.addEventListener("mouseleave", hideButton);
	editButton.addEventListener("mouseenter", showButton);
	editButton.addEventListener("mouseleave", hideButton);
	nativeEditButton?.addEventListener("mouseenter", showButton);
	nativeEditButton?.addEventListener("mouseleave", hideButton);

	editButton.onclick = onClick;
	codeblockDom.appendChild(editButton);
	return editButton;
}

function justifyTop(codeblockDom: HTMLElement, editButton: HTMLDivElement) {
	const nativeEditButton = findNativeEditButton(codeblockDom);
	let top: string | undefined;
	if (nativeEditButton) {
		top = getComputedStyle(nativeEditButton).top;
	}

	editButton.style.top = top || "0";
}

function findNativeEditButton(codeblockDom: HTMLElement): HTMLElement | null {
	return (
		codeblockDom.querySelector<HTMLElement>(".edit-block-button") ??
		codeblockDom.parentElement?.querySelector<HTMLElement>(".edit-block-button") ??
		null
	);
}
