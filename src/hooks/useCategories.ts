import { useSuspenseQuery } from "@tanstack/react-query";
import { settings } from "@lib/models/settings";
import { CATEGORIES_KEY } from "./keys";

const useCategories = () => {
	const { data, error } = useSuspenseQuery({
		queryKey: [CATEGORIES_KEY],
		queryFn: () => settings.getLike("category.%")
	});
	if (error) throw error;
	return data;
};

export default useCategories;
