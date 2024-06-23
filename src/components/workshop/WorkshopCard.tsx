import type { ProjectResult } from "@lib/api/modrinth/types.gen";
import { Link } from "react-router-dom";
import { Skeleton } from "../ui/skeleton";

export const WorkshopCard: React.FC<{ project: ProjectResult }> = ({
	project,
}) => {
	return (
		<Link className="flex p-2" to={`/workshop/${project.project_id}`}>
			<div className="h-40 w-40">
				<img
					className="h-full w-full"
					alt={project.title}
					src={project.icon_url ?? undefined}
				/>
			</div>
			<div className="ml-2">
				<h1 className="text-lg font-bold"> {project.title}</h1>

				<p className="w-60 text-wrap text-sm">{project.description}</p>
			</div>
		</Link>
	);
};

export const WorkshopCardSkeleton: React.FC = () => {
	return (
		<div className="flex p-2">
			<div className="h-40 w-40">
				<Skeleton className="h-full w-full" />
			</div>
			<div className="ml-2 flex flex-col justify-between">
				<Skeleton className="h-4 w-32" />

				<Skeleton className="h-32 w-60" />
			</div>
		</div>
	);
};
