import { useSuspenseQuery } from "@tanstack/react-query";
import { Profile } from "@/lib/models/profiles";
import { query } from "@lib/api/plugins/query";
import { PROFILES_KEY } from "./keys";

export const useProfiles = () => {
	const { data, error } = useSuspenseQuery({
		queryKey: [PROFILES_KEY],
		queryFn: () => query("SELECT * FROM profiles;").as(Profile).all(),
	});

	if (error) throw error;

	return data;
};
