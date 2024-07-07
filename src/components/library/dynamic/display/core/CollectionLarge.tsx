import { Link } from "@tanstack/react-router";
import { Layers3 } from "lucide-react";
import { memo } from "react";
import useCategoryGroup from "@/hooks/useCategoryGroup";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import PlayButton from "@/components/ui/play";

export const CollectionLargeLoading: React.FC = memo(() => {
	return (
		<>
			{Array.from({ length: 8 }).map((_, i) => (
				<div className="space-y-3 w-[256px]" key={`fav_profile_skel_${i + 1}`}>
					<div className="space-y-1 text-sm">
						<Skeleton className="h-5 w-20" />
						<Skeleton className="h-4 w-10" />
					</div>
					<div className="overflow-hidden rounded-md">
						<Skeleton className="rounded-lg h-64 w-64" />
					</div>
					<div className="flex gap-4">
						<Skeleton className="w-full h-10" />
						<Skeleton className="w-full h-10" />
					</div>
				</div>
			))}
		</>
	);
});

const CollectionLarge: React.FC<{ cat: string }> = ({ cat }) => {
	const data = useCategoryGroup(cat);

	return (
		<>
			{data.length === 0 ? (
				<div className="flex h-full w-full items-center justify-center">
					No Profiles Yet!
				</div>
			) : (
				data.map((value) => (
					<div className="space-y-3 w-[256px]" key={value.id}>
						<div className="space-y-1 text-sm">
							<h3 className="font-medium leading-none text-lg line-clamp-2">
								{value.name}
							</h3>
							<p className="text-xs text-muted-foreground">
								{value.loader.replace(/^\w/, value.loader[0].toUpperCase())}{" "}
								{value.version}
							</p>
						</div>
						<div className="overflow-hidden rounded-md ">
							<div className="bg-accent rounded-lg h-64 w-64 flex items-center justify-center">
								{value.icon ? (
									<img
										className="h-full object-fill transition-all hover:scale-105 aspect-square"
										src={value.icon}
										alt={value.name}
									/>
								) : (
									<Layers3 />
								)}
							</div>
						</div>
						<div className="flex gap-4">
							<Button className="w-full" variant="secondary" asChild>
								<Link to="/profile/$id" params={{ id: value.id }}>
									View
								</Link>
							</Button>
							<PlayButton className="w-full" profile={value} />
						</div>
					</div>
				))
			)}
		</>
	);
};

export default CollectionLarge;
