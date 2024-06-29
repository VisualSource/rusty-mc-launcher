import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { exists, readDir } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path";
import { FileImage } from "lucide-react";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { settings } from "@/lib/models/settings";
import { Loading } from "@/components/Loading";
import { showInFolder } from "@/lib/system/commands";

const profileScreenshotsQueryOptions = (id: string) =>
	queryOptions({
		queryKey: ["PROFILE", id, "SCREENSHOTS"],
		queryFn: async () => {
			const paths = await settings.select("path.app");
			const path = paths.at(0)?.value;
			if (!path) throw new Error("Missing app directory");
			const screenshot_dir = await join(path, "profiles", id, "screenshots");
			if (!(await exists(screenshot_dir))) return [];
			const entries = await readDir(screenshot_dir, { recursive: false });
			return entries.map((item) => convertFileSrc(item.path));
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
				query.data.map(e => (
					<Avatar onClick={() => showInFolder(decodeURIComponent(e.replace("asset://", "").replace("https://asset.localhost/", "")))} className="my-2 aspect-square h-36 rounded-lg w-full hover:scale-105 transition-all" key={e}>
						<AvatarFallback className="rounded-lg">
							<FileImage />
						</AvatarFallback>
						<AvatarImage src={e} />
					</Avatar>
				))
			) : (
				<div className="flex flex-col justify-center items-center h-full">
					No Screenshots!
				</div>
			)}
		</div>
	);
}
