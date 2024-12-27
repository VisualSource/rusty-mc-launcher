import { Facets } from "../Facets";

export type IndexType = "relevance" | "downloads" | "follows" | "newest" | "updated";

const DEFUALT_FACETS = [
	[
		"categories:'forge'",
		"categories:'fabric'",
		"categories:'quilt'",
		"categories:'modloader'",
		"categories:'neoforge'",
	],
	["project_type:mod"],
];

class SearchManager extends EventTarget {
	public facets: Facets = new Facets(DEFUALT_FACETS);
	public limit = 24;
	public offset = 0;
	public query?: string;
	public index: IndexType = "relevance";

	private state = {
		facets: this.facets,
		limit: this.limit,
		offset: this.offset,
		query: this.query,
		index: this.index
	};

	public update() {
		this.state = {
			facets: this.facets,
			limit: this.limit,
			offset: this.offset,
			query: this.query,
			index: this.index
		}
		this.dispatchEvent(new Event("update"));
	}
	public setLimit(value: number) {
		if (value < 0 || value > 100) throw new Error("Value out of range");
		this.limit = value;
		return this;
	}
	public setOffset(value: number) {
		if (value < 0) throw new Error("Value needs to be greater then or equal to 0");
		this.offset = value;
		return this;
	}
	public setIndex(value: IndexType) {
		this.index = value;
		return this;
	}
	public setQuery(value: string | undefined) {
		this.query = value;
		return this;
	}

	public getSnapshot() {
		return this.state;
	}
}

const manager = new SearchManager();

export default manager;