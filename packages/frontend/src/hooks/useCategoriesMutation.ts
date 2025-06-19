import { fromZodError } from "zod-validation-error";
import { useMutation } from "@tanstack/react-query";
import { error } from "@tauri-apps/plugin-log";
import { z } from "zod";

import { query, transaction } from "@lib/api/plugins/query";
import { queryClient } from "@/lib/api/queryClient";
import { toastError } from "@/lib/toast";
import { CATEGORIES_KEY } from "./keys";

export const useCategoriesMutation = () => {
	return useMutation({
		onError(result) {
			error(result.message, {
				file: "useCategories",
				keyValues: {
					name: result.name,
					stack: result.stack,
				},
			});
		},
		mutationFn: async (payload: {
			type: "POST" | "PATCH" | "DELETE";
			data: Record<string, unknown>;
		}) => {
			await queryClient.cancelQueries({ queryKey: [CATEGORIES_KEY] });
			switch (payload.type) {
				case "POST": {
					const id = crypto.randomUUID();
					await query`INSERT INTO settings VALUES (${`category.${id}`},${id},${payload.data.name});`.run();
					break;
				}
				case "PATCH": {
					const content = z
						.object({ name: z.string(), id: z.string() })
						.safeParse(payload.data);
					if (content.error) {
						const error = fromZodError(content.error);
						toastError({
							title: "Update Failed",
							description: "Failed to update collection!",
							error: error.message,
						});
						throw error;
					}

					await query`UPDATE settings SET value = ${content.data.name} WHERE key = ${`category.${content.data.id}`};`.run();

					break;
				}
				case "DELETE": {
					const id = z.string().safeParse(payload.data.id);
					if (id.error) {
						const error = fromZodError(id.error);

						toastError({
							title: "Deletion Failed",
							description: "Failed to delete collection!",
							error: error.message,
						});

						throw error;
					}

					await transaction((query) => {
						query`DELETE FROM categories WHERE category = ${id.data};`;
						query`DELETE FROM settings WHERE key = ${`category.${id.data}`};`;
					});
					break;
				}
			}
			await queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
		},
	});
};
