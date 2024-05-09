import { useSuspenseQuery } from "@tanstack/react-query";
import { profile } from "@lib/models/profiles";
import { CATEGORY_KEY } from "./keys";
import DB from "@lib/api/db";

const useCategoryGroup = (group_id: number) => {
  const { data, error } = useSuspenseQuery({
    queryKey: [CATEGORY_KEY, group_id],
    queryFn: async () => {
      const db = DB.use();
      const result = await db.select<unknown[]>(`SELECT profile.* FROM profile LEFT JOIN categories on profile.id = categories.profile_id WHERE categories.profile_id NOT NULL AND categories.group_id = ${group_id};`)
      return result.map(e => profile.schema.parse(e));
    },
  });

  if (error) throw error;
  return data;
};

export default useCategoryGroup;
