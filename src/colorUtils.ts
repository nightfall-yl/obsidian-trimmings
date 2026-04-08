export function hexToRGBA(hex: string, alphaPercent: number): string {
	if (!hex.startsWith("#") || hex.length !== 7) {
		return hex;
	}

	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	const alpha = Math.max(0, Math.min(100, alphaPercent)) / 100;
	return `rgb(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export function convertToRGBA(color: string, alphaPercent: number): string {
	if (color.startsWith("#")) {
		return hexToRGBA(color, alphaPercent);
	}

	return color;
}
