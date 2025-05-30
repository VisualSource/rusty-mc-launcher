import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { getProject } from "../api/modrinth/sdk.gen";

export const projectQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["MODRINTH", "PROJECT", id],
		queryFn: async () => {
			const project = await getProject({
				path: { "id|slug": id },
			});
			if (project.error) throw project.error;
			if (project.response.status === 404) throw notFound();
			if (!project.response.ok || !project.data) throw project.response;
			return project.data;
		},
	});
