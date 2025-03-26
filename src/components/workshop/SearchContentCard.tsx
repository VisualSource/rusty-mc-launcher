import { Activity, Download, FileImage, Heart } from "lucide-react";
import { formatRelative } from "date-fns/formatRelative";
import { Link } from "@tanstack/react-router";
import { memo } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader } from "../ui/card";
import type { ProjectResult } from "@/lib/api/modrinth";
import { TypographyH4 } from "../ui/typography";
import { Badge } from "../ui/badge";

export const SearchContentCard: React.FC<{ project: ProjectResult }> = memo(
	({ project }) => {
		return (
			<Link to="/workshop/project/$id" params={{ id: project.project_id }}>
				<Card className="h-full flex flex-col">
					<CardHeader className="flex-row gap-4 space-y-0 pb-2 flex">
						<div className="flex justify-center items-center">
							<Avatar className="h-15 w-15">
								<AvatarFallback>
									<FileImage />
								</AvatarFallback>
								<AvatarImage src={project.icon_url ?? undefined} />
							</Avatar>
						</div>
						<div title={project.title}>
							<TypographyH4 className="line-clamp-1">
								{project.title ?? "Unknown Project"}
							</TypographyH4>
							<span className="text-sm text-muted-foreground">
								By <span className="underline">{project.author}</span>
							</span>
						</div>
					</CardHeader>
					<CardContent className="flex grow flex-col">
						<div className="col-span-3 flex flex-col gap-2 justify-between h-full">
							<p className="line-clamp-5 text-sm xl:text-base xl:py-2">
								{project.description}
							</p>
							<div className="space-y-1">
								<div className="flex flex-wrap gap-1">
									{project.display_categories?.map((cat) => (
										<Badge key={`${project.project_id}_${cat}`}>{cat}</Badge>
									))}
								</div>
								<div className="flex items-center gap-2 flex-wrap">
									<div className="flex items-center" title="Downloads">
										<Download className="mr-1 h-5 w-5" />
										<span className="text-sm xl:text-lg font-bold">
											{project.downloads.toLocaleString(undefined, {
												notation: "compact",
												maximumFractionDigits: 2,
											})}
										</span>
									</div>
									<div className="flex items-center" title="Follows">
										<Heart className="mr-1 h-5 w-5" />
										<span className="text-sm xl:text-lg font-bold">
											{project.follows.toLocaleString()}
										</span>
									</div>
									<div className="mt-auto flex items-center" title="Updated">
										<Activity className="mr-1 h-5 w-5" />
										<span className="font-bold">
											{formatRelative(project.date_modified, new Date())}
										</span>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</Link>
		);
	},
);
SearchContentCard.displayName = "SearchContentCard";
