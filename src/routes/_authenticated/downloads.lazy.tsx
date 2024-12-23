import { FileDiff, Monitor, PackagePlus } from "lucide-react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { DownloadSection } from "@/components/download/DownloadSection";
import SectionDivider from "@component/download/SectionDivider";
import DownloadItem from "@/components/download/DownloadItem";
import { useCurrentQueue, useQueue } from "@hook/useQueue";
import { TypographyMuted } from "@component/ui/typography";
import { ScrollArea } from "@component/ui/scroll-area";
import { QueueItemState } from "@/lib/QueueItemState";
import { Loading } from "@/components/Loading";
import { useDownloadProgress } from "@/hooks/useDownloadProgress";

export const Route = createLazyFileRoute("/_authenticated/downloads")({
	component: Download,
	pendingComponent: Loading,
});

function Download() {
	const current = useCurrentQueue();
	const progress = useDownloadProgress();
	const queueNext = useQueue(QueueItemState.PENDING);

	return (
		<div className="grid h-full w-full grid-cols-1 grid-rows-6 text-zinc-50">
			<div className="row-span-2 border-b border-b-blue-300 bg-blue-900/20 p-2">
				{current && progress ? (
					<div className="flex gap-4">
						<Avatar className="h-32 w-32 rounded-none xl:h-60 xl:w-60">
							<AvatarFallback className="h-32 w-32 rounded-lg xl:h-60 xl:w-60">
								{current.content_type === "Client" ? (
									<Monitor className="h-24 w-24" />
								) : current.content_type === "Mod" ? (
									<PackagePlus className="h-24 w-24" />
								) : (
									<FileDiff className="h-24 w-24" />
								)}
							</AvatarFallback>
							<AvatarImage src={current.icon ?? undefined} />
						</Avatar>

						<div>
							<h1>{current.display_name}</h1>
							<div>{progress.status}</div>
							<div>
								{progress.amount} of {progress.max}
							</div>
						</div>
					</div>
				) : null}
			</div>
			<ScrollArea className="container row-span-4 py-2">
				{!queueNext.isError && !queueNext.isLoading ? (
					<section className="flex w-full flex-col">
						<SectionDivider
							label="Up Next"
							count={queueNext?.data?.length ?? 0}
						/>
						<div className="flex flex-col gap-2 pl-4 pt-2">
							{queueNext?.data?.length ? (
								queueNext?.data.map((item) => (
									<DownloadItem key={item.id} {...item} />
								))
							) : (
								<TypographyMuted>
									There are no downloads in queue
								</TypographyMuted>
							)}
						</div>
					</section>
				) : null}

				<DownloadSection label="Postponed" group={QueueItemState.POSTPONED} />
				<DownloadSection
					label="Completed"
					group={QueueItemState.COMPLETED}
					order="ASC"
				/>
				<DownloadSection
					label="Errored"
					group={QueueItemState.ERRORED}
					order="ASC"
				/>
			</ScrollArea>
		</div>
	);
}
