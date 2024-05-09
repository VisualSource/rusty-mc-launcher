import { useSuspenseQuery } from "@tanstack/react-query";
import { CATEGORIES_KEY } from "./keys";
import DB from "@lib/api/db";

const useCategories = () => {
  const { data, error } = useSuspenseQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: () => {
      const db = DB.use();
      return db.select<{ name: string; group_id: number; count: number }[]>("SELECT name, group_id, COUNT(group_id) as count FROM categories GROUP BY group_id;");
    },
  });
  if (error) throw error;
  return data;
};

export default useCategories;
