import { fromZodError } from "zod-validation-error";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { query, transaction } from "@lib/api/plugins/query";
import { createToast } from "@component/ui/toast";
import { queryClient } from "@/lib/api/queryClient";
import { CATEGORIES_KEY } from "./keys";

export const useCategoriesMutation = () => {
	return useMutation({
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
						const message = fromZodError(content.error);
						createToast({
							variant: "error",
							title: "Failed to delete collection!",
							error: message,
						});
						throw message;
					}

					await query`UPDATE settings SET value = ${content.data.name} WHERE key = ${`category.${content.data.id}`};`.run();

					break;
				}
				case "DELETE": {
					const id = z.string().safeParse(payload.data.id);
					if (id.error) {
						const message = fromZodError(id.error);

						createToast({
							variant: "error",
							title: "Failed to delete collection!",
							error: message,
						});

						throw message;
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
