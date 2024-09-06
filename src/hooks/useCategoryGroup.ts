import { useSuspenseQuery } from "@tanstack/react-query";
import { Profile } from "@/lib/models/profiles";
import { query } from "@lib/api/plugins/query";
import { CATEGORY_KEY } from "./keys";

const useCategoryGroup = (category: string | null) => {
	const { data, error } = useSuspenseQuery({
		queryKey: [CATEGORY_KEY, category],
		queryFn: async () => {
			if (!category) throw new Error("Invalid id");
			return query("SELECT profiles.* FROM profiles LEFT JOIN categories on profiles.id = categories.profile WHERE categories.category = ?;", [category]).as(Profile).all();
		},
	});
	if (error) throw error;
	return data;
};

export default useCategoryGroup;
