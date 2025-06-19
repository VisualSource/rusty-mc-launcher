import { Loading } from "@/components/Loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TypographyH1, TypographyH4 } from "@/components/ui/typography";
import { projectQueryOptions } from "@/lib/query/curseForgeProjectQuery";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute, ErrorComponent } from "@tanstack/react-router";
import { formatRelative } from "date-fns/formatRelative";
import {
	AlertTriangle,
	Calendar,
	Download,
	Flame,
	Image,
	Plus,
	User2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

export const Route = createLazyFileRoute(
	"/_authenticated/workshop/curseforge/$id",
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
	const params = Route.useParams();
	const { data } = useSuspenseQuery(projectQueryOptions(params.id));

	return (
		<div className="bg-accent/50">
			<div className="container flex flex-col text-zinc-50 mt-4">
				<div className="flex items-center gap-4 py-4 rounded-lg bg-blue-900/10 px-4">
					<Avatar className="h-14 w-140">
						<AvatarFallback className="h-14 w-14">
							<Image />
						</AvatarFallback>
						<AvatarImage className="h-14 w-14" src={data.thumbnail} />
					</Avatar>
					<TypographyH1>{data.title}</TypographyH1>
				</div>
				<section className="grid grid-cols-4 gap-8 pt-4">
					<div className="col-span-3 flex flex-col gap-4">
						<div className="flex gap-2 py-2 px-4 bg-blue-900/10 justify-between">
							<a
								title={data.urls.curseforge}
								rel="noopener noreferrer"
								target="_blank"
								href={data.urls.curseforge}
								className="rounded-md hover:bg-zinc-600/50 bg-zinc-600 px-2 py-1 text-sm font-bold inline-flex items-center gap-1"
							>
								<Flame className="h-5 w-5" />
								Curseforge
							</a>

							<Button disabled size="sm">
								<Plus />
								Install
							</Button>
						</div>
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
								{data.description}
							</ReactMarkdown>
						</article>
					</div>

					<div className="col-span-1 flex flex-col gap-2">
						<section className="space-y-2">
							<TypographyH4>Details</TypographyH4>

							<div className="flex items-center gap-1">
								<Download className="h-5 w-5" />
								<span className="font-bold">
									{data.downloads.total.toLocaleString(undefined, {
										notation: "compact",
										maximumFractionDigits: 2,
									})}
								</span>
								Downloads
							</div>

							<div className="flex items-center gap-1">
								<Calendar className="h-5 w-5" />
								<span className="font-bold">Created</span>
								{formatRelative(data.created_at, new Date())}
							</div>

							<div className="flex items-center gap-1">
								<span className="font-bold">Project Id:</span>
								<span className="rounded-md bg-zinc-600 px-2 text-sm italic">
									{data.id}
								</span>
							</div>
						</section>
						<section className="space-y-2">
							<TypographyH4>Categories</TypographyH4>
							<ul className="space-y-2 ml-4">
								{data.categories.map((e, i) => (
									<li key={`cat_${i + 1}`}>
										<Badge>{e}</Badge>
									</li>
								))}
							</ul>
						</section>
						<section className="space-y-2">
							<TypographyH4>Project members</TypographyH4>
							<ul className="space-y-2 ml-4">
								{data.members.map((e) => (
									<li key={e.id}>
										<div className="flex items-center gap-2">
											<Avatar>
												<AvatarFallback>
													<User2 />
												</AvatarFallback>
											</Avatar>
											<div>
												<h5 className="line-clamp-1 font-bold">{e.username}</h5>
												<p className="line-clamp-1 text-sm italic">{e.title}</p>
											</div>
										</div>
									</li>
								))}
							</ul>
						</section>
						{data.versions_list.length ? (
							<section>
								<TypographyH4>Versions</TypographyH4>
								{data.versions_list
									.toReversed()
									.slice(0, 6)
									.map((value, i) => (
										<Badge key={`${value}_${i + 1}`}>{value}</Badge>
									))}
								<details>
									<summary>View More</summary>
									{data.versions_list
										.toReversed()
										.slice(6)
										.map((value, i) => (
											<Badge key={`${value}_${i + 1}`}>{value}</Badge>
										))}
								</details>
							</section>
						) : null}
					</div>
				</section>
			</div>
		</div>
	);
}
