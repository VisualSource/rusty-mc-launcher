import {
	AlertTriangle,
	Bug,
	Calendar,
	Code,
	DollarSign,
	Download,
	Globe,
	Heart,
	HeartOff,
	Plus,
	RefreshCcw,
} from "lucide-react";
import {
	ErrorComponent,
	createLazyFileRoute,
	useRouter,
} from "@tanstack/react-router";
import { formatRelative } from "date-fns/formatRelative";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { Suspense } from "react";

import {
	useIsModrinthAuthed,
	useModrinth,
	useModrinthFollows,
} from "@/hooks/useModrinth";
import { TypographyH1, TypographyH4 } from "@/components/ui/typography";
import { projectQueryOptions } from "@/lib/query/modrinthProjectQuery";
import SelectProfile from "@/components/dialog/ProfileSelection";
import { createToast, updateToast } from "@component/ui/toast";
import { Gallery } from "@/components/workshop/Gallery";
import { Team } from "@/components/workshop/Team";
import { Button } from "@/components/ui/button";
import { install } from "@/lib/system/install";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";

export const Route = createLazyFileRoute(
	"/_authenticated/workshop/project/$id",
)({
	component: Project,
	errorComponent: (error) => <ErrorComponent error={error} />,
	notFoundComponent: () => (
		<div className="p-2 text-2xl h-full w-full flex justify-center items-center">
			<div className="inline-block px-2">
				<AlertTriangle />
			</div>
			<span>Not Found</span>
		</div>
	),
	pendingComponent: Loading,
});

function Project() {
	const router = useRouter();
	const params = Route.useParams();
	const modrinth = useModrinth();
	const isModrinthAuthed = useIsModrinthAuthed();
	const follows = useModrinthFollows();
	const query = useSuspenseQuery(projectQueryOptions(params.id));
	const project = query.data;

	return (
		<div className="bg-accent/50">
			<SelectProfile />
			<div className="p-3">
				<Button onClick={() => router.history.back()}>Back</Button>
			</div>
			<div className="container flex flex-col text-zinc-50">
				<div className="flex justify-between py-4">
					<TypographyH1>{project.title}</TypographyH1>
				</div>

				{project?.source_url || project.gallery?.length || project?.issues_url || project?.wiki_url || project?.discord_url || project?.donation_urls?.length ? (
					<section className="rounded-lg bg-blue-900/10 p-2 shadow-2xl">
						{project.gallery?.length ? (
							<Gallery gallery={project.gallery} />
						) : null}

						<div className="flex flex-wrap gap-2 px-2">
							{project.source_url ? (
								<a title={project.source_url}
									rel="noopener noreferrer"
									target="_blank"
									href={project.source_url}
									className="rounded-md hover:bg-zinc-600/50 bg-zinc-600 px-2 py-1 text-sm font-bold inline-flex items-center gap-1"
								>
									<Code className="h-5 w-5" />
									Source
								</a>
							) : null}
							{project.issues_url ? (
								<a
									title={project.issues_url}
									rel="noopener noreferrer"
									target="_blank"
									href={project.issues_url}
									className="rounded-md hover:bg-zinc-600/50 bg-zinc-600 px-2 py-1 text-sm font-bold inline-flex items-center gap-1"
								>
									<Bug className="h-5 w-5" />
									Issues
								</a>
							) : null}
							{project.wiki_url ? (
								<a
									title={project.wiki_url}
									rel="noopener noreferrer"
									target="_blank"
									href={project.wiki_url}
									className="rounded-md hover:bg-zinc-600/50 bg-zinc-600 px-2 py-1 text-sm font-bold inline-flex items-center gap-1"
								>
									<Globe className="h-5 w-5" />
									Wiki
								</a>
							) : null}
							{project.discord_url ? (
								<a
									title={project.discord_url}
									target="_blank"
									rel="noopener noreferrer"
									href={project.discord_url}
									className="rounded-md hover:bg-zinc-600/50 bg-zinc-600 px-2 py-1 text-sm font-bold inline-flex items-center gap-1"
								>
									<DiscordLogoIcon className="h-5 w-5" />
									Discord
								</a>
							) : null}
							{project.donation_urls
								? project.donation_urls.map((value) => (
									<a
										title={value.url}
										href={value.url}
										target="_blank"
										key={value.id}
										className="rounded-md hover:bg-zinc-600/50 bg-zinc-600 px-2 py-1 text-sm font-bold inline-flex items-center gap-1"
										rel="noopener noreferrer"
									>
										<DollarSign className="h-5 w-5" />
										{value.platform
											? "Donate"
											: value.platform === "Other"
												? "Donate"
												: value.platform}
									</a>
								))
								: null}
						</div>
					</section>
				) : null}

				<div className="grid grid-cols-4 gap-8 pt-4">
					<div className="col-span-3 flex flex-col gap-4">
						<section className="flex justify-between items-center rounded-lg bg-blue-900/10 p-4 shadow-2xl">
							<TypographyH4>{project.title}</TypographyH4>

							<div className="flex items-center gap-2">
								<Button size="sm"
									onClick={async () => {
										const toastId = createToast({
											closeButton: false,
											title: "Updating",
											opts: { isLoading: true },
										});
										try {
											const state =
												follows.data?.findIndex((e) => e.id === project.id) !==
												-1;
											if (state) {
												await modrinth.unfollowProject(project.id);
											} else {
												await modrinth.followProject(project.id);
											}

											updateToast(toastId, {
												variant: "success",
												title: state
													? `Unfollowed project: ${project.title}`
													: `Followed project: ${project.title}`,
												opts: {
													isLoading: false,
													autoClose: 5000,
												},
											});
										} catch (error) {
											console.error(error);
											updateToast(toastId, {
												error,
												variant: "error",
												title: "Failed to update project follow",
												opts: {
													isLoading: false,
													autoClose: 5000,
												}
											});
										}
									}}
									disabled={!isModrinthAuthed}
									variant="secondary"
								>
									{isModrinthAuthed &&
										follows.data?.findIndex((e) => e.id === project.id) !== -1 ? (
										<>
											<HeartOff className="mr-2 h-5 w-5" /> Unfollow
										</>
									) : (
										<>
											<Heart className="mr-2 h-5 w-5" /> Follow
										</>
									)}
								</Button>

								<Button size="sm"
									title="Install content"
									onClick={() => install(project)}
								>
									<Plus className="mr-1" /> Install
								</Button>
							</div>
						</section>
						<article className="prose prose-invert mb-4 max-w-none">
							<ReactMarkdown
								components={{
									a: ({ children, href }) => (
										<a target="_blank" rel="noopener noreferrer" href={href}>
											{children}
										</a>
									),
								}}
								rehypePlugins={[rehypeRaw]}
								remarkPlugins={[remarkGfm]}
							>
								{project.body}
							</ReactMarkdown>
						</article>
					</div>

					<div className="col-span-1 flex flex-col gap-2">
						<section className="space-y-2">
							<TypographyH4>Details</TypographyH4>
							<div className="flex items-center gap-1">
								<Download className="h-5 w-5" />
								<span className="font-bold">
									{project.downloads.toLocaleString(undefined, {
										notation: "compact",
										maximumFractionDigits: 2,
									})}
								</span>
								Downloads
							</div>
							<div className="flex items-center gap-1">
								<Heart className="h-5 w-5" />
								<span className="font-bold">
									{project.followers.toLocaleString(undefined, {
										notation: "compact",
										maximumFractionDigits: 1,
									})}
								</span>
								followers
							</div>

							<div className="flex items-center gap-1">
								<Calendar className="h-5 w-5" />
								<span className="font-bold">Created</span>
								<span className="text-sm italic">{formatRelative(project.published, new Date())}</span>
							</div>
							<div className="flex items-center gap-1">
								<RefreshCcw className="h-5 w-5" />
								<span className="font-bold">Updated</span>
								<span className="text-sm italic">{formatRelative(project.updated, new Date())}</span>
							</div>

							<div className="flex items-center gap-1">
								<span className="font-bold">Project Id:</span>
								<span className="rounded-md bg-zinc-600 px-2 text-sm italic">
									{project.id}
								</span>
							</div>
						</section>

						<section className="space-y-2">
							<TypographyH4>Project members</TypographyH4>
							<Suspense>
								<Team id={project.team} />
							</Suspense>
						</section>

						{project.license ? (
							<section>
								<TypographyH4>License</TypographyH4>
								<a
									target="_blank"
									rel="noopener noreferrer"
									className="text-sm text-blue-600 underline ml-4"
									href={project.license.url ?? ""}
								>
									{project.license.name}
								</a>
							</section>
						) : null}

						<section>
							<TypographyH4>Supports</TypographyH4>
							<p className="text-sm ml-4">Client Side: {project.client_side}</p>
							<p className="text-sm ml-4">Server Side: {project.server_side}</p>
						</section>

						{project.loaders ? (
							<section>
								<TypographyH4>Mod Loaders</TypographyH4>
								<div className="ml-4">
									{project.loaders?.map((value, i) => (
										<Badge key={`${value}_${i + 1}`}>{value}</Badge>
									))}
								</div>
							</section>
						) : null}

						{project.game_versions ? (
							<section>
								<TypographyH4>Versions</TypographyH4>
								<div className="ml-4 flex gap-1 flex-wrap">
									{project.game_versions
										.toReversed()
										.slice(0, 6)
										.map((value, i) => (
											<Badge key={`${value}_${i + 1}`}>{value}</Badge>
										))}
								</div>
								<details>
									<summary>View More</summary>
									{project.game_versions
										.toReversed()
										.slice(6)
										.map((value, i) => (
											<Badge key={`${value}_${i + 1}`}>{value}</Badge>
										))}
								</details>
							</section>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
