import { queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { coerce } from "semver";

export const projectQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["CURSEFORGE_PROJECT", id],
		queryFn: async () => {
			const project = await fetch(`https://api.cfwidget.com/${id}`);

			if (!project.ok) throw project;

			const data = (await project.json()) as {
				id: number;
				game: string;
				title: string;
				type: string;
				urls: {
					curseforge: string;
					project: string;
				};
				members: {
					title: string;
					username: string;
					id: number;
				}[];
				license: string;
				downloads: {
					total: number;
					monthly: number;
				};
				versions: Record<string, { id: number }[]>[];
				thumbnail: string;
				categories: string[];
				created_at: string;
				description: string;
				download: unknown;
				links: unknown[];
				versions_list: string[];
			};

			if (data.game !== "minecraft") throw notFound();

			data.versions_list = Object.keys(data.versions)
				.map((e) => coerce(e))
				.filter(Boolean)
				.toSorted((a, b) => a.compare(b))
				.map((e) => e.toString());

			return data;
		},
	});
