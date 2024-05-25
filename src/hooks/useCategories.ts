import { useSuspenseQuery } from "@tanstack/react-query";
import { CATEGORIES_KEY } from "./keys";
import { settings } from "@lib/models/settings";
import { db } from "@lib/system/commands";

const useCategories = () => {
  const { data, error } = useSuspenseQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: () =>
      db.select({
        query: "SELECT * FROM settings WHERE key LIKE 'category.%';",
        schema: settings.schema,
      }),
  });
  if (error) throw error;
  return data;
};

export default useCategories;
