import { useSuspenseQuery } from "@tanstack/react-query";
import { Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayButton from "@/components/ui/play";
import { Skeleton } from "@/components/ui/skeleton";
import { FAVORITES_GUID } from "@/lib/models/categories";
import { CATEGORY_KEY } from "@hook/keys";
import { profile } from "@lib/models/profiles";
import { db } from "@system/commands";
import { Link } from "@tanstack/react-router";

export const FavoritesLoading: React.FC = () => {
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
};

const Favorites: React.FC = () => {
	const { data, error } = useSuspenseQuery({
		queryKey: [CATEGORY_KEY, FAVORITES_GUID],
		queryFn: () =>
			db.select<typeof profile.schema>({
				query:
					"SELECT profiles.* FROM profiles LEFT JOIN categories on profiles.id = categories.profile WHERE categories.category = ?",
				args: [FAVORITES_GUID],
				schema: profile.schema,
			}),
	});

	if (error) throw error;

	return (
		<>
			{data.length === 0 ? (
				<div className="flex h-full w-full items-center justify-center">
					No Favorites Yet!
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

export default Favorites;
