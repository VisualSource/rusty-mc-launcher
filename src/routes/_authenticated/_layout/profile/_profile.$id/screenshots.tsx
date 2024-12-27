import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { exists, readDir } from "@tauri-apps/plugin-fs";
import { convertFileSrc } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { FileImage } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showInFolder } from "@lib/api/plugins/content";
import { getConfig } from "@/lib/models/settings";
import { Loading } from "@/components/Loading";

const profileScreenshotsQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["PROFILE", id, "SCREENSHOTS"],
		queryFn: async () => {
			const paths = await getConfig("path.app");
			const path = paths?.value;
			if (!path) throw new Error("Missing app directory");
			const screenshot_dir = await join(path, "profiles", id, "screenshots");
			if (!(await exists(screenshot_dir))) return [];
			const entries = await readDir(screenshot_dir);
			// TODO: full file path?
			return entries.map((item) => convertFileSrc(item.name));
		},
	});

export const Route = createFileRoute(
	"/_authenticated/_layout/profile/_profile/$id/screenshots",
)({
	component: Screenshots,
	errorComponent: (error) => <ErrorComponent error={error} />,
	pendingComponent: Loading,
	loader: (opts) =>
		opts.context.queryClient.ensureQueryData(
			profileScreenshotsQueryOptions(opts.params.id),
		),
});

function Screenshots() {
	const params = Route.useParams();
	const query = useSuspenseQuery(profileScreenshotsQueryOptions(params.id));

	return (
		<div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 grid-rows-none grid-flow-dense h-full overflow-y-scroll gap-4 p-2">
			{query.data.length >= 1 ? (
				query.data.map((e) => (
					<Avatar
						onClick={() =>
							showInFolder(
								decodeURIComponent(
									e
										.replace("asset://", "")
										.replace("https://asset.localhost/", ""),
								),
							)
						}
						className="my-2 aspect-square h-36 rounded-lg w-full hover:scale-105 transition-all"
						key={e}
					>
						<AvatarFallback className="rounded-lg">
							<FileImage />
						</AvatarFallback>
						<AvatarImage src={e} />
					</Avatar>
				))
			) : (
				<div className="flex flex-col justify-center items-center h-full col-span-2">
					No Screenshots!
				</div>
			)}
		</div>
	);
}
