export class HomeboardError extends Error {
	summary: string;
	recommends?: string[];

	constructor({ summary, recommends }: { summary: string; recommends?: string[] }) {
		super(summary);
		this.name = "HomeboardError";
		this.summary = summary;
		this.recommends = recommends || [];
	}
}
