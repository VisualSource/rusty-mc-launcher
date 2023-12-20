import { useMutation, useQueryClient } from "@tanstack/react-query"
import categories from "../models/categories";
import { CATEGORIES_KEY, CATEGORY_KEY } from "./keys";
import { toast } from "react-toastify";
import logger from "../system/logger";

type Query = { type: "create", group: number; profile: string; } | { type: "delete", profile: string; group: number };

const useCategoryMutation = () => {
    const client = useQueryClient();
    const mutate = useMutation({
        onSuccess(_, variables) {
            client.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
            client.invalidateQueries({ queryKey: [CATEGORY_KEY, variables.group] });
            client.invalidateQueries({ queryKey: [1, variables.profile] });
        },
        onError(error, variables) {
            logger.error(error);
            toast.error("Failed to profile to category", {
                data: {
                    event: "profile-category",
                    type: variables.type,
                    time: new Date()
                }
            });
        },
        mutationFn: async (data: Query) => {
            switch (data.type) {
                case "create": {
                    try {
                        const exists = await categories.execute<{ count: number }>(`SELECT COUNT(*) as count FROM %table% WHERE group_id=${data.group} AND profile_id="${data.profile}";`);

                        if (exists && exists.at(0)?.count === 0) {
                            await categories.execute(`INSERT INTO %table% (id,group_id,profile_id) VALUES ("${crypto.randomUUID()}",${data.group},"${data.profile}");`);
                        }
                    } catch (error) {
                        logger.error(error);
                    }
                    break;
                }
                case "delete": {
                    await categories.delete({
                        where: [{ profile_id: data.profile, group_id: data.group }]
                    });
                    break;
                }
                default:
                    break;
            }
        }
    });

    return mutate;
}

export default useCategoryMutation;