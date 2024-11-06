import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Setting } from "@lib/models/settings";
import { CATEGORIES_KEY } from "./keys";
import { query } from "@lib/api/plugins/query";

export const categoriesQueryOptions = queryOptions({
	queryKey: [CATEGORIES_KEY],
	queryFn: () =>
		query("SELECT * FROM settings WHERE key LIKE 'category.%';")
			.as(Setting)
			.all(),
});

const useCategories = () => {
	const { data, error } = useSuspenseQuery(categoriesQueryOptions);
	if (error) throw error;
	return data;
};

export default useCategories;
