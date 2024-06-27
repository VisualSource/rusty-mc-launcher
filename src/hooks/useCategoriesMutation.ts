import { queryClient } from "@/lib/api/queryClient";
import { CATEGORIES_KEY } from "./keys";
import { db } from "@/lib/system/commands";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

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
					await db.execute({
						query: "INSERT INTO settings VALUES (?,?,?)",
						args: [`category.${id}`, id, payload.data.name],
					});
					break;
				}
				case "PATCH": {
					const content = z
						.object({ name: z.string(), id: z.string() })
						.safeParse(payload.data);
					if (content.error) {
						const message = fromZodError(content.error);
						toast.error("Failed to delete collection!", {
							data: message,
						});
						throw message;
					}

					await db.execute({
						query: "UPDATE settings SET value = ? WHERE key = ?",
						args: [content.data.name, `category.${content.data.id}`],
					});

					break;
				}
				case "DELETE": {
					const id = z.string().safeParse(payload.data.id);
					if (id.error) {
						const message = fromZodError(id.error);

						toast.error("Failed to delete collection!", {
							data: message,
						});

						throw message;
					}

					await db.execute({
						query: "DELETE FROM categories WHERE category = ?",
						args: [id.data],
					});

					await db.execute({
						query: "DELETE FROM settings WHERE key = ?",
						args: [`category.${id.data}`],
					});
					break;
				}
			}
			await queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
		},
	});
};
