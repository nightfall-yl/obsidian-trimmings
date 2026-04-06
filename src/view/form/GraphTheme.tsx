import { DEFAULT_RULES } from "src/constants";
import { Locals } from "src/i18/messages";
import { Local } from "src/i18/types";
import { CellStyleRule } from "src/types";

export interface Theme {
	name: string;
	label: string;
	description?: string;
	rules: CellStyleRule[];
}

const BASE_THEMES: Array<Omit<Theme, "label"> & { labelKey: keyof Local }> = [
	{
		name: "default",
		labelKey: "form_theme_default",
		description: "",
		rules: DEFAULT_RULES,
	},
	{
		name: "Ocean",
		labelKey: "form_theme_ocean",
		description: "",
		rules: buildPureColorTheme(
			"Ocean",
			"#8dd1e2",
			"#63a1be",
			"#376d93",
			"#012f60"
		),
	},
	{
		name: "Halloween",
		labelKey: "form_theme_halloween",
		description: "",
		rules: buildPureColorTheme(
			"Halloween",
			"#fdd577",
			"#faaa53",
			"#f07c44",
			"#d94e49"
		),
	},
	{
		name: "Lovely",
		labelKey: "form_theme_lovely",
		description: "",
		rules: buildPureColorTheme(
			"Lovely",
			"#fedcdc",
			"#fdb8bf",
			"#f892a9",
			"#ec6a97"
		),
	},
	{
		name: "Wine",
		labelKey: "form_theme_wine",
		description: "",
		rules: buildPureColorTheme(
			"Wine",
			"#d8b0b3",
			"#c78089",
			"#ac4c61",
			"#830738"
		),
	},
];

export function getThemes(local?: Local): Theme[] {
	const currentLocal = local ?? Locals.get();
	return BASE_THEMES.map((theme) => ({
		name: theme.name,
		label: currentLocal[theme.labelKey],
		description: theme.description,
		rules: theme.rules,
	}));
}

export function getThemeSwatches(theme: Theme): string[] {
	return theme.rules.map((rule) => rule.color).slice(0, 4);
}

export function matchThemeByRules(
	rules: CellStyleRule[] | undefined,
	themes?: Theme[]
): Theme | null {
	if (!rules || rules.length === 0) {
		return null;
	}

	const themeList = themes ?? getThemes();

	return (
		themeList.find((theme) => {
			if (theme.rules.length !== rules.length) {
				return false;
			}
			return theme.rules.every((themeRule, index) => {
				const rule = rules[index];
				return (
					rule?.color === themeRule.color &&
					rule?.min === themeRule.min &&
					rule?.max === themeRule.max
				);
			});
		}) ?? null
	);
}

export function buildPureColorTheme(
	themeName: string,
	a: string,
	b: string,
	c: string,
	d: string
) {
	return [
		{
			id: `${themeName}_a`,
			color: a,
			min: 1,
			max: 2,
		},
		{
			id: `${themeName}_b`,
			color: b,
			min: 2,
			max: 3,
		},
		{
			id: `${themeName}_c`,
			color: c,
			min: 3,
			max: 5,
		},
		{
			id: `${themeName}_d`,
			color: d,
			min: 5,
			max: 9999,
		},
	];
}
