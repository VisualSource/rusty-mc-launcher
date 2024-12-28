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

				<section className="rounded-lg bg-blue-900/10 p-2 shadow-2xl">
					{project.gallery?.length ? (
						<Gallery gallery={project.gallery} />
					) : null}

					<div className="flex flex-wrap gap-2 p-4">
						{project.source_url ? (
							<a
								rel="noopener noreferrer"
								target="_blank"
								href={project.source_url}
								className="flex items-center"
							>
								<Code className="pr-2" />
								<span className="text-blue-600 underline">Source</span>
							</a>
						) : null}
						{project.issues_url ? (
							<a
								rel="noopener noreferrer"
								target="_blank"
								href={project.issues_url}
								className="flex items-center"
							>
								<Bug className="pr-2" />
								<span className="text-blue-600 underline">Issues</span>
							</a>
						) : null}
						{project.wiki_url ? (
							<a
								rel="noopener noreferrer"
								target="_blank"
								href={project.wiki_url}
								className="flex"
							>
								<Globe className="pr-2" />
								<span className="text-blue-600 underline">Wiki</span>
							</a>
						) : null}
						{project.discord_url ? (
							<a
								target="_blank"
								rel="noopener noreferrer"
								href={project.discord_url}
								className="flex items-center"
							>
								<DiscordLogoIcon />
								<span className="pl-2 text-blue-600 underline">Discord</span>
							</a>
						) : null}
						{project.donation_urls
							? project.donation_urls.map((value) => (
								<a
									href={value.url}
									target="_blank"
									key={value.id}
									className="flex items-center"
									rel="noopener noreferrer"
								>
									<DollarSign className="pr-2" />
									<span className="text-blue-600 underline">
										{value.platform
											? "Donate"
											: value.platform === "Other"
												? "Donate"
												: value.platform}
									</span>
								</a>
							))
							: null}
					</div>
				</section>

				<div className="grid grid-cols-4 gap-8 pt-4">
					<div className="col-span-3 flex flex-col gap-4">
						<section className="flex justify-between rounded-lg bg-blue-900/10 p-4 shadow-2xl">
							<TypographyH4>{project.title}</TypographyH4>

							<div className="flex items-center gap-2">
								<Button
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

								<Button
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
								{formatRelative(project.published, new Date())}
							</div>
							<div className="flex items-center gap-1">
								<RefreshCcw className="h-5 w-5" />
								<span className="font-bold">Updated</span>
								{formatRelative(project.updated, new Date())}
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
									className="text-sm text-blue-600 underline"
									href={project.license.url ?? ""}
								>
									{project.license.name}
								</a>
							</section>
						) : null}

						<section>
							<TypographyH4>Supports</TypographyH4>
							<p className="text-sm">Client Side: {project.client_side}</p>
							<p className="text-sm">Server Side: {project.server_side}</p>
						</section>

						{project.loaders ? (
							<section>
								<TypographyH4>Mod Loaders</TypographyH4>
								<div>
									{project.loaders?.map((value, i) => (
										<Badge key={`${value}_${i + 1}`}>{value}</Badge>
									))}
								</div>
							</section>
						) : null}

						{project.game_versions ? (
							<section>
								<TypographyH4>Versions</TypographyH4>
								{project.game_versions
									.toReversed()
									.slice(0, 6)
									.map((value, i) => (
										<Badge key={`${value}_${i + 1}`}>{value}</Badge>
									))}
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
