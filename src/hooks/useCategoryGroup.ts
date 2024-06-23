import { useSuspenseQuery } from "@tanstack/react-query";
import { profile } from "@/lib/models/profiles";
import { db } from "@lib/system/commands";
import { CATEGORY_KEY } from "./keys";

const useCategoryGroup = (category: string) => {
	const { data, error } = useSuspenseQuery({
		queryKey: [CATEGORY_KEY, category],
		queryFn: async () =>
			db.select({
				query: `SELECT profiles.* FROM profiles LEFT JOIN categories on profiles.id = categories.profile WHERE categories.category = ?;`,
				args: [category],
				schema: profile.schema,
			}),
	});
	if (error) throw error;
	return data;
};

export default useCategoryGroup;
