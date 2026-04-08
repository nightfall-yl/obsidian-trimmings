import { parseYaml } from "obsidian";
import { HomeboardError } from "./homeboardError";
import { HomepageConfig, HomepageLinkItem } from "./homepageTypes";
import { Locals } from "./i18/messages";

function parseShortcutLinks(line: string): HomepageLinkItem[] {
	const links: HomepageLinkItem[] = [];
	const pattern = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\(([^)]+)\)/g;

	for (const match of line.matchAll(pattern)) {
		if (match[1]) {
			const target = match[1].trim();
			const label = (match[2] || match[1]).trim();
			links.push({
				label,
				url: target,
			});
			continue;
		}

		if (match[3] && match[4]) {
			links.push({
				label: match[3].trim(),
				url: match[4].trim(),
			});
		}
	}

	return links;
}

function parseShortcutHomepageConfig(code: string): HomepageConfig | null {
	const rawLines = code
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

	if (!rawLines.some((line) => line === "===")) {
		return null;
	}

	let id: string | undefined;
	if (rawLines[0]?.startsWith("id:")) {
		id = rawLines.shift()?.slice(3).trim();
	}

	const sections = rawLines
		.join("\n")
		.split(/\n===\n/)
		.map((chunk) => chunk.split("\n").map((line) => line.trim()).filter(Boolean))
		.filter((chunk) => chunk.length >= 2);

	if (sections.length === 0) {
		return null;
	}

	return {
		id,
		columns: sections.length,
		gap: 0,
		cards: sections.map((section) => ({
			type: "links" as const,
			title: section[0],
			span: 1,
			linksLayout: "inline" as const,
			links: parseShortcutLinks(section.slice(1).join(" ")),
		})),
	};
}

export function parseHomepageConfig(code: string): HomepageConfig {
	const local = Locals.get();
	if (!code.trim()) {
		throw new HomeboardError({
				summary: local.homeboard_error_empty,
			recommends: [local.homeboard_error_empty_recommend],
		});
	}

	try {
		const shortcutConfig = parseShortcutHomepageConfig(code);
		if (shortcutConfig) {
			return shortcutConfig;
		}

		const config = parseYaml(code) as HomepageConfig | null;
		if (!config || typeof config !== "object") {
			throw new HomeboardError({
				summary: local.homeboard_error_invalid_yaml_object,
			});
		}

		if (!config.cards || !Array.isArray(config.cards) || config.cards.length === 0) {
			throw new HomeboardError({
				summary: local.homeboard_error_card_required,
				recommends: [local.homeboard_error_card_required_recommend],
			});
		}

		return config;
	} catch (error) {
		if (error instanceof HomeboardError) {
			throw error;
		}

		const line = (error as { mark?: { line?: number } })?.mark?.line;
		if (typeof line === "number") {
			throw new HomeboardError({
				summary: local.homeboard_error_yaml_failed_at_line.replace("{line}", String(line + 1)),
			});
		}

		throw new HomeboardError({
			summary: local.homeboard_error_yaml_failed,
		});
	}
}
