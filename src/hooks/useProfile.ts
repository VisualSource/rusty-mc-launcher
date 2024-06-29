import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { profile, type MinecraftProfile } from "@lib/models/profiles";
import { db } from "@system/commands";
import { KEY_PROFILE } from "./keys";
import logger from "@system/logger";

type RequestType = { type: "patch"; data: Partial<MinecraftProfile> };
type RequestDelete = { type: "delete"; data: { id: string } };

const handleMutate = async (ev: RequestType | RequestDelete) => {
	if (ev.type === "patch") {
		const values = Object.entries(ev.data)
			.filter((e) => e[0] !== "id")
			.map((key, value) => `${key}='${value.toString()}'`);

		await db.execute({
			query: `UPDATE profiles SET ${values.join(", ")} WHERE id = ?`,
			args: [ev.data.id],
		});

		return ev.data;
	}

	if (ev.type === "delete") {
		await db.execute({
			query: "DELETE FROM profiles WHERE id = ?",
			args: [ev.data.id],
		});
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
			logger.info(`Loading Profile ${id}`);
			const data = await db.select({
				query: "SELECT * FROM profiles WHERE id = ?",
				args: [id],
				schema: profile.schema,
			});
			const item = data.at(0);

			if (!item) throw new Error("Failed to get minecraft profile");
			return item;
		},
	});

	const mutate = useMutation({
		mutationFn: handleMutate,

		async onSuccess(data) {
			if (!data) {
				navigate("/library");
				return;
			}

			await queryClient.cancelQueries({ queryKey: [KEY_PROFILE, id] });
			queryClient.setQueryData<MinecraftProfile>(
				[KEY_PROFILE, id],
				(old) => data as MinecraftProfile,
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
