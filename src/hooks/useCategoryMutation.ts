import { useMutation, useQueryClient } from "@tanstack/react-query";
import { categories } from "@lib/models/categories";
import { CATEGORIES_KEY, CATEGORY_KEY } from "./keys";
import { toast } from "react-toastify";
import logger from "@system/logger";
import { db } from "@system/commands";

type Query =
  | { type: "create"; group: string; profile: string }
  | { type: "delete"; profile: string; group: string };

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
          time: new Date(),
        },
      });
    },
    mutationFn: async (data: Query) => {
      switch (data.type) {
        case "create": {
          try {
            await db.execute({
              query: "INSERT INTO categories ('profile','category') VALUES (?,?)",
              args: [data.profile, data.group]
            })
          } catch (error) {
            logger.error(error);
          }
          break;
        }
        case "delete": {
          await db.execute({
            query: "DELETE FROM categories WHERE profile = ? AND category = ?",
            args: [data.profile, data.group]
          });
          break;
        }
        default:
          break;
      }
    },
  });

  return mutate;
};

export default useCategoryMutation;
