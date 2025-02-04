import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Loading } from "@/components/Loading";
import { projectQueryOptions } from "@/lib/query/curseForgeProjectQuery";

export const Route = createFileRoute("/_authenticated/workshop/curseforge/$id")(
	{
		parseParams: (params) => ({
			id: z.string().parse(params.id),
		}),
		loader: (opts) =>
			opts.context.queryClient.ensureQueryData(
				projectQueryOptions(opts.params.id),
			),
		errorComponent: (error) => <ErrorComponent error={error} />,
		pendingComponent: Loading,
	},
);
