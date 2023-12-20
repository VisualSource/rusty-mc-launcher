import { useSuspenseQuery } from "@tanstack/react-query";
import { CATEGORIES_KEY } from "./keys";
import categories from "../models/categories";

const query = async () => {
  const result = await categories.execute<{
    group_id: number;
    name: string;
    count: number;
  }>(
    "SELECT name, group_id, COUNT(group_id) as count FROM categories GROUP BY group_id;",
  );
  if (!result) throw new Error("Failed to loaded categories");
  return result;
};

const useCategories = () => {
  const { data, error } = useSuspenseQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: query,
  });
  if (error) throw error;
  return data;
};

export default useCategories;
