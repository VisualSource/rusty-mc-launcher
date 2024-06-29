type FacetsValues = {
	loaders: string[];
	versions: string[];
	client_side: string[];
	server_side: string[];
	categories: string[];
	project_type: string;
};

export class Facets {
	static SHADER_LOADERS = ["canvas", "iris", "optifine", "vanilla shader"];
	static INCLUDE_LOADERS = [
		"fabric",
		"neoforge",
		"forge",
		"quilt",
		"modloader",
	];
	private facets: FacetsValues = {
		categories: [],
		project_type: "mod",
		client_side: [],
		server_side: [],
		versions: [],
		loaders: [],
	};

	constructor(facets: string[][]) {
		for (const facet of facets) {
			for (const item of facet) {
				const [key, value] = item.split(":");
				const v = value.replaceAll("'", "");
				if (key === "project_type") {
					this.facets.project_type = v;
					break;
				}
				if (
					key === "categories" &&
					(Facets.INCLUDE_LOADERS.includes(v) ||
						Facets.SHADER_LOADERS.includes(v))
				) {
					this.facets.loaders.push(v);
					continue;
				}
				const group = this.facets[key as keyof FacetsValues] as
					| Array<string>
					| undefined;
				if (!group) continue;
				group.push(v);
			}
		}
	}
	private reset() {
		this.facets.categories = [];
		this.facets.loaders = [];
		this.facets.server_side = [];
		this.facets.client_side = [];
		this.facets.versions = [];
		this.facets.loaders = [];
	}
	public toggleVersion(name: string): this {
		const idx = this.facets.versions.findIndex((e) => e === name);
		if (idx === -1) {
			this.facets.versions.push(name);
			return this;
		}
		this.facets.versions.splice(idx, 1);
		return this;
	}
	public toggleLoader(name: string): this {
		const idx = this.facets.loaders.findIndex((e) => e === name);
		if (idx === -1) {
			this.facets.loaders.push(name);
			return this;
		}
		this.facets.loaders.splice(idx, 1);
		return this;
	}
	public toggleCategory(name: string): this {
		const idx = this.facets.categories.findIndex((e) => e === name);
		if (idx === -1) {
			this.facets.categories.push(name);
			return this;
		}
		this.facets.categories.splice(idx, 1);
		return this;
	}
	setProjectType(name: string): this {
		this.reset();
		this.facets.project_type = name;
		switch (name) {
			case "mod": {
				this.facets.loaders = [...Facets.INCLUDE_LOADERS];
				break;
			}
			case "datapack": {
				this.facets.project_type = "mod";
				this.facets.categories = ["datapack"];
				break;
			}
			default:
				break;
		}
		return this;
	}
	getProjectType(): string {
		return this.facets.project_type;
	}
	getDisplayProjectType(): string {
		if (
			this.facets.project_type === "mod" &&
			this.facets.categories.includes("datapack")
		) {
			return "datapack";
		}
		return this.facets.project_type;
	}
	toggleEnv(name: "client" | "server"): this {
		switch (name) {
			case "client":
				if (
					this.facets.server_side.length === 2 &&
					this.facets.server_side.includes("required")
				) {
					this.facets.server_side = ["required"];
					this.facets.client_side = ["required"];
					break;
				}
				this.facets.client_side = ["optional", "required"];
				this.facets.server_side = ["optional", "unsupported"];
				break;
			case "server":
				if (
					this.facets.client_side.length === 2 &&
					this.facets.client_side.includes("required")
				) {
					this.facets.server_side = ["required"];
					this.facets.client_side = ["required"];
					break;
				}
				this.facets.client_side = ["optional", "unsupported"];
				this.facets.server_side = ["optional", "required"];
				break;
		}

		return this;
	}
	toArray(): string[][] {
		const output: string[][] = [];

		for (const cat of this.facets.categories) {
			output.push([`categories:${cat}`]);
		}

		if (this.facets.loaders.length) {
			output.push(this.facets.loaders.map((e) => `categories:${e}`));
		}

		if (this.facets.versions.length) {
			output.push(this.facets.versions.map((e) => `versions:${e}`));
		}
		if (this.facets.client_side.length) {
			output.push(this.facets.client_side.map((e) => `client_size:${e}`));
		}
		if (this.facets.server_side.length) {
			output.push(this.facets.server_side.map((e) => `client_size:${e}`));
		}

		output.push([`project_type:${this.facets.project_type}`]);

		return output;
	}
	isAnyProject(value: readonly string[]): boolean {
		return value.includes(this.facets.project_type);
	}
	hasCategory(name: string): boolean {
		return this.facets.categories.includes(name);
	}
	hasLoader(name: string): boolean {
		return this.facets.loaders.includes(name);
	}
	hasAnyLoader(name: string[]): boolean {
		return this.facets.loaders.some((e) => name.includes(e));
	}
}
