import { useSuspenseQuery } from "@tanstack/react-query";
import { User2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getTeamMembers } from "@lib/api/modrinth/sdk.gen";

export const Team: React.FC<{ id: string }> = ({ id }) => {
	const { data } = useSuspenseQuery({
		queryKey: ["modrinth", "team", id],
		queryFn: async () => {
			const repsonse = await getTeamMembers({
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
		<ul className="space-y-2 ml-4">
			{data
				.toSorted((a, b) => (b.ordering ?? 0) - (a.ordering ?? 0))
				.map((e) => (
					<li key={e.user.id}>
						<div className="flex items-center gap-2">
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
					</li>
				))}
		</ul>
	);
};
