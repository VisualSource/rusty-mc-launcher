import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Box, Images, Package, Settings } from "lucide-react";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { profile } from "@/lib/models/profiles";
import PlayButton from "@/components/ui/play";

export const profileQueryOptions = (id: string) => queryOptions({
	queryKey: ["PROFILE", id],
	queryFn: async () => profile.get(id)
});


export const Route = createFileRoute("/_authenticated/_layout/profile/$id")({
	component: Profile,
	parseParams(rawParams) {
		return { id: z.string().parse(rawParams.id) }
	},
	loader: (opts) => opts.context.queryClient.ensureQueryData(profileQueryOptions(opts.params.id))
});

function Profile() {
	const params = Route.useParams();
	const profileQuery = useSuspenseQuery(profileQueryOptions(params.id));
	const data = profileQuery.data;

	return (
		<div className="grid h-full grid-cols-12 p-2">
			<div className="col-span-3 h-full space-y-4 rounded-xl bg-zinc-900 p-2 shadow-md">
				<div className="flex justify-between gap-2">
					<Avatar className="h-28 w-28 rounded-3xl bg-zinc-600 shadow-xl">
						<AvatarFallback className="rounded-none bg-transparent">
							<Box className="h-14 w-14" />
						</AvatarFallback>
						<AvatarImage src={data?.icon ?? undefined} />
					</Avatar>
				</div>
				<div>
					<h1 className="line-clamp-2 text-wrap text-lg font-bold">
						{data.name}
					</h1>
					<p className="flex text-sm">
						{data.loader.replace(/^./, data.loader[0].toUpperCase())}{" "}
						{data.version}
					</p>
				</div>
				<div className="flex justify-evenly gap-1">
					<PlayButton
						className="w-full"
						profile={{ id: data.id, state: data.state }}
					/>
				</div>

				<Separator />
				<ul className="space-y-2 px-4">
					<li>
						<Button className="w-full" variant="secondary" size="sm" asChild>
							<Link to="/profile/$id/content" params={params}>
								<Package className="mr-1 h-5 w-5" /> Content
							</Link>
						</Button>
					</li>
					<li>
						<Button className="w-full" variant="secondary" size="sm" asChild>
							<Link to="/profile/$id/screenshots" params={params}>
								<Images className="mr-1 h-5 w-5" /> Screenshots
							</Link>
						</Button>
					</li>
					<li>
						<Button className="w-full" variant="secondary" size="sm" asChild>
							<Link to="/profile/$id/edit" params={params}>
								<Settings className="mr-1 h-5 w-5" /> Settings
							</Link>
						</Button>
					</li>
				</ul>
			</div>

			<div className="scrollbar col-span-9 ml-6 overflow-y-scroll">
				<Outlet />
			</div>
		</div>
	);
}