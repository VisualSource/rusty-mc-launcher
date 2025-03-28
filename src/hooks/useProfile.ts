import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Profile } from "@lib/models/profiles";
import { query, sqlValue } from "@lib/api/plugins/query";
import { KEY_PROFILE } from "./keys";

type RequestType = { type: "patch"; data: Partial<Profile> };
type RequestDelete = { type: "delete"; data: { id: string } };

const handleMutate = async (ev: RequestType | RequestDelete) => {
	if (ev.type === "patch") {
		const values = Object.entries(ev.data)
			.filter((e) => e[0] !== "id")
			.map((key, value) => `${key}='${value.toString()}'`);
		await query`UPDATE profiles SET ${sqlValue(values.join(", "))} WHERE id = ${ev.data.id}`.run();
		return ev.data;
	}

	if (ev.type === "delete") {
		await query`DELETE FROM profiles WHERE id = ${ev.data.id}`.run();
		return null;
	}
};

export const useProfile = (id?: string, load = true) => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data, isError, isLoading, error } = useQuery({
		enabled: !!id && load,
		queryKey: [KEY_PROFILE, id],
		queryFn: async () => {
			const item = await query`SELECT * FROM profiles WHERE id = ${id} LIMIT 1;`
				.as(Profile)
				.get();
			if (!item) throw new Error("Failed to get minecraft profile");
			return item;
		},
	});

	const mutate = useMutation({
		mutationFn: handleMutate,

		async onSuccess(data) {
			if (!data) {
				navigate({ to: "/" });
				return;
			}

			await queryClient.cancelQueries({ queryKey: [KEY_PROFILE, id] });
			queryClient.setQueryData<Profile>(
				[KEY_PROFILE, id],
				(_old) => data as Profile,
			);
		},
	});

	return {
		mutate,
		profile: data,
		isError,
		isLoading,
		error,
	};
};
