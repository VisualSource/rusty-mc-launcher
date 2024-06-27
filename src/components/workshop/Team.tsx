import { useSuspenseQuery } from "@tanstack/react-query";
import { User2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getTeamMembers } from "@lib/api/modrinth/services.gen";
import { modrinthClient } from "@/lib/api/modrinthClient";

export const Team: React.FC<{ id: string }> = ({ id }) => {
	const { data } = useSuspenseQuery({
		queryKey: ["modrinth", "team", id],
		queryFn: async () => {
			const repsonse = await getTeamMembers({
				client: modrinthClient,
				path: {
					id,
				},
			});
			if (repsonse.error) throw repsonse.error;
			if (!repsonse.data) throw new Error("Failed to load team members");
			return repsonse.data;
		},
	});

	return (
		<ul className="space-y-2">
			{data
				.toSorted((a, b) => (b.ordering ?? 0) - (a.ordering ?? 0))
				.map((e) => (
					<div key={e.user.id} className="flex items-center gap-2">
						<Avatar>
							<AvatarFallback>
								<User2 />
							</AvatarFallback>
							<AvatarImage src={e.user.avatar_url} />
						</Avatar>
						<div>
							<h5 className="line-clamp-1 font-bold">{e.user.username}</h5>
							<p className="line-clamp-1 text-sm italic">{e.role}</p>
						</div>
					</div>
				))}
		</ul>
	);
};
