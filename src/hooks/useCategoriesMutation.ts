import { queryClient } from "@/lib/api/queryClient";
import { CATEGORIES_KEY } from "./keys";
import { query } from "@lib/api/plugins/query";
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
					await query("INSERT INTO settings VALUES (?,?,?)", [
						`category.${id}`,
						id,
						payload.data.name
					]).run();
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

					await query("UPDATE settings SET value = ? WHERE key = ?", [
						content.data.name,
						`category.${content.data.id}`
					]).run();

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

					await query(`
						BEGIN TRANSACTION; 
							DELETE FROM categories WHERE category = ?;
							DELETE FROM settings WHERE key = ?;
						END TRANSACTION;
					`, [id.data, `category.${id.data}`]);
					break;
				}
			}
			await queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
		},
	});
};
