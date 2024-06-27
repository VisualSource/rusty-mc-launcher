import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { settings } from "@lib/models/settings";
import { CATEGORIES_KEY } from "./keys";

export const categoriesQueryOptions = queryOptions({
	queryKey: [CATEGORIES_KEY],
	queryFn: () => settings.getLike("category.%"),
});

const useCategories = () => {
	const { data, error } = useSuspenseQuery(categoriesQueryOptions);
	if (error) throw error;
	return data;
};

export default useCategories;
