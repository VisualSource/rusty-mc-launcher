import { Book, HardDriveDownload, CircleUserRound, Play } from "lucide-react";
import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TypographyH3, TypographyH4 } from "@/components/ui/typography";
import { DownloadSettings } from "@/components/settings/DownloadSettings";
import { LaunchSettings } from "@/components/settings/LaunchSettings";
import { Accounts } from "@/components/settings/Accounts";
import { version } from "@masl/index";

export const Route = createLazyFileRoute("/_authenticated/settings")({
	component: Settings,
});

function Settings() {
	const { data } = useSuspenseQuery({
		queryKey: ["app-data"],
		queryFn: async () => {
			const [name, tauri, version] = await Promise.all([
				getName(),
				getTauriVersion(),
				getVersion(),
			]);
			return {
				name,
				tauri,
				version,
			};
		},
	});

	return (
		<Tabs
			className="grid h-full w-full grid-cols-12 bg-blue-900/20 text-zinc-50"
			defaultValue="about"
			orientation="vertical"
		>
			<TabsList className="col-span-2 flex h-full flex-col items-start justify-start gap-2">
				<TabsTrigger value="about" className="flex w-full justify-start">
					<Book className="pr-2" /> About
				</TabsTrigger>
				<TabsTrigger value="account" className="flex w-full justify-start">
					<CircleUserRound className="pr-2" /> Accounts
				</TabsTrigger>
				<TabsTrigger value="download" className="flex w-full justify-start">
					<HardDriveDownload className="pr-2" /> Downloads
				</TabsTrigger>
				<TabsTrigger value="launch" className="flex w-full justify-start">
					<Play className="pr-2" /> Launch
				</TabsTrigger>
			</TabsList>
			<TabsContent value="download" className="container col-span-10 space-y-4">
				<DownloadSettings />
			</TabsContent>
			<TabsContent value="account" className="container col-span-10">
				<Accounts />
			</TabsContent>
			<TabsContent value="about" className="container col-span-10">
				<TypographyH3>About</TypographyH3>
				<div className="mt-4">
					<TypographyH4>Application Specifications</TypographyH4>
					<div className="mt-2">
						<table>
							<tbody>
								<tr>
									<th className="text-left" colSpan={2}>
										App Name
									</th>
									<td>{data?.name}</td>
								</tr>
								<tr>
									<th className="text-left" colSpan={2}>
										App Version
									</th>
									<td>{data?.version}</td>
								</tr>
								<tr>
									<th className="text-left" colSpan={2}>
										Tauri Version
									</th>
									<td>{data?.tauri}</td>
								</tr>
								<tr>
									<th className="text-left" colSpan={2}>
										Msal Version
									</th>
									<td>{version}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</TabsContent>
			<TabsContent value="launch" className="container col-span-10">
				<LaunchSettings />
			</TabsContent>
		</Tabs>
	);
}