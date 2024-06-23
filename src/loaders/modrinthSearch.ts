import type { ActionFunction } from "react-router-dom";
import { ProjectsService } from "@lib/api/modrinth/services.gen";
import type { IndexType } from "@lib/api/modrinth/types.gen";

const modrinthSearch: ActionFunction = async ({ request }) => {
	const query = new URL(request.url).searchParams;

	let offset = Number.parseInt(query.get("offset")?.toString() ?? "0");
	if (Number.isNaN(offset)) offset = 0;

	console.log(query);

	return ProjectsService.searchProjects({
		query: query.get("query") ?? "",
		facets:
			query.get("facets") ??
			JSON.stringify([
				[
					"categories:'forge'",
					"categories:'fabric'",
					"categories:'quilt'",
					"categories:'modloader'",
				],
				["project_type:mod"],
			]),
		index: (query.get("index") as IndexType) ?? "relevance",
		offset,
		limit: 18,
	});
};

export default modrinthSearch;
