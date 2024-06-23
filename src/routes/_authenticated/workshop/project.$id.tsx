import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

import { modrinthClient } from "@lib/api/modrinthClient";
import { getProject } from "@lib/api/modrinth/services.gen";

const projectQueryOptions = (id: string) => queryOptions({
	queryKey: ["modrinth", "project", id],
	queryFn: async () => {
		const project = await getProject({ client: modrinthClient, path: { "id|slug": id } });
		if (project.error) throw project.error;
		if (!project.response.ok || !project.data) throw project.response;
		return project.data;
	}
})

export const Route = createFileRoute("/_authenticated/workshop/project/$id")({
	parseParams: (params) => ({
		id: z.string().parse(params.id)
	}),
	loader: (opts) => opts.context.queryClient.ensureQueryData(projectQueryOptions(opts.params.id)),
	component: Project,
});

function Project() {
	const params = Route.useParams();
	const projectQuery = useSuspenseQuery(projectQueryOptions(params.id));

	const project = projectQuery.data;

	return (
		<div>
			{JSON.stringify(project)}
		</div>
	);
}
