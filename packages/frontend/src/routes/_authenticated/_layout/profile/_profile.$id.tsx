import {
	ErrorComponent,
	Link,
	Outlet,
	createFileRoute,
} from "@tanstack/react-router";
import { AlertTriangle, Box, Images, Package, Settings } from "lucide-react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { formatRelative } from "date-fns/formatRelative";
import { memo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { query } from "@/lib/api/plugins/query";
import { Profile } from "@/lib/models/profiles";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import PlayButton from "@/components/ui/play";
import { KEY_PROFILE } from "@/hooks/keys";

export const profileQueryOptions = (id: string) =>
	queryOptions({
		queryKey: [KEY_PROFILE, id],
		queryFn: async () => {
			const result =
				await query`SELECT * FROM profiles WHERE id = ${id} LIMIT 1;`
					.as(Profile)
					.get();
			if (!result) throw new Error("No Profile found");
			return result;
		},
	});

export const Route = createFileRoute(
	"/_authenticated/_layout/profile/_profile/$id",
)({
	component: memo(ProfilePage),
	loader: (opts) =>
		opts.context.queryClient.ensureQueryData(
			profileQueryOptions(opts.params.id),
		),
	pendingComponent: () => <Loading />,
	notFoundComponent: () => (
		<div className="p-2 text-2xl h-full w-full flex justify-center items-center">
			<div className="inline-block px-2">
				<AlertTriangle />
			</div>
			<span>Not Found</span>
		</div>
	),
	errorComponent: (error) => <ErrorComponent error={error} />,
});

function ProfilePage() {
	const params = Route.useParams();
	const profileQuery = useSuspenseQuery(profileQueryOptions(params.id));
	const data = profileQuery.data;

	return (
		<div className="grid h-full grid-cols-12 p-2">
			<div className="col-span-3 h-full space-y-4 rounded-lg bg-zinc-900 p-2 shadow-md">
				<div className="flex gap-2 justify-center">
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
					<span className="text-xs text-muted-foreground">
						<span className="font-bold">Last Played: </span>
						<span>
							{data.last_played
								? formatRelative(new Date(data.last_played), new Date())
								: "Never"}
						</span>
					</span>
				</div>
				<div className="flex justify-evenly gap-1">
					<PlayButton
						className="w-full"
						profile={{
							id: data.id,
							state: data.state,
						}}
					/>
				</div>

				<Separator />
				<ul className="space-y-2 px-4">
					<li>
						<Button
							className="w-full justify-start"
							variant="secondary"
							size="sm"
							asChild
						>
							<Link to="/profile/$id" params={params}>
								<Package className="mr-2 h-5 w-5" /> Content
							</Link>
						</Button>
					</li>
					<li>
						<Button
							className="w-full justify-start"
							variant="secondary"
							size="sm"
							asChild
						>
							<Link to="/profile/$id/screenshots" params={params}>
								<Images className="mr-2 h-5 w-5" /> Screenshots
							</Link>
						</Button>
					</li>
					<li>
						<Button
							className="w-full justify-start"
							variant="secondary"
							size="sm"
							asChild
						>
							<Link to="/profile/$id/edit" params={params}>
								<Settings className="mr-2 h-5 w-5" /> Settings
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
