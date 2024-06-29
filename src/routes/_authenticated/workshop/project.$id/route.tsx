import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { projectQueryOptions } from "@/lib/query/modrinthProjectQuery";
import { Loading } from "@/components/Loading";

export const Route = createFileRoute("/_authenticated/workshop/project/$id")({
	parseParams: (params) => ({
		id: z.string().parse(params.id),
	}),
	loader: (opts) =>
		opts.context.queryClient.ensureQueryData(
			projectQueryOptions(opts.params.id),
		),
	errorComponent: (error) => <ErrorComponent error={error} />,
	pendingComponent: Loading,
});
