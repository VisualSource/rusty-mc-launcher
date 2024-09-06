import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CATEGORIES_KEY, CATEGORY_KEY, KEY_PROFILE_COLLECTION } from "./keys";
import type { Category } from "@lib/models/categories";
import { query } from "@lib/api/plugins/query";
import logger from "@system/logger";

type Query = { type: "add" | "remove"; category: string; profile: string };

const useCategoryMutation = () => {
	const client = useQueryClient();
	const mutate = useMutation({
		onSettled(_data, _error, variables) {
			client.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
			client.invalidateQueries({
				queryKey: [CATEGORY_KEY, variables.category],
			});
			client.invalidateQueries({
				queryKey: [KEY_PROFILE_COLLECTION, variables.profile],
			});
		},
		onError(error, variables, context) {
			logger.error(error);
			client.setQueryData(
				[KEY_PROFILE_COLLECTION, variables.profile],
				(context as { previous: Category[] }).previous,
			);
		},
		mutationFn: async (data: Query) => {
			await client.cancelQueries({
				queryKey: [KEY_PROFILE_COLLECTION, data.profile],
			});

			const previous = client.getQueryData([
				KEY_PROFILE_COLLECTION,
				data.profile,
			]);

			switch (data.type) {
				case "add": {
					client.setQueryData(
						[KEY_PROFILE_COLLECTION, data.profile],
						(old: Category[]) => [
							...old,
							{ id: "", category: data.category, profile: data.profile },
						],
					);

					await query("INSERT INTO categories ('profile','category') VALUES (?,?);", [data.profile, data.category]).run();
					break;
				}
				case "remove": {
					client.setQueryData(
						[KEY_PROFILE_COLLECTION, data.profile],
						(old: Category[]) =>
							old.filter((e) => e.category !== data.category),
					);
					await query("DELETE FROM categories WHERE profile = ? AND category = ?", [data.profile, data.category]).run();
					break;
				}
			}

			return { previous };
		},
	});

	return mutate;
};

export default useCategoryMutation;
