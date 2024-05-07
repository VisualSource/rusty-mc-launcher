import { useSuspenseQuery } from "@tanstack/react-query";
import { CATEGORY_KEY } from "./keys";
import profiles from "@lib/models/profiles";

const useCategoryGroup = (group_id: number) => {
  const { data, error } = useSuspenseQuery({
    queryKey: [CATEGORY_KEY, group_id],
    queryFn: async () => {
      const result = await profiles.execute(
        `SELECT profile.* FROM profile LEFT JOIN categories on profile.id = categories.profile_id WHERE categories.profile_id NOT NULL AND categories.group_id = ${group_id};`,
      );
      if (!result) throw new Error("Failed to load results");
      return result.map((value) => profiles.parse(value));
    },
  });
  if (error) throw error;
  return data;
};

export default useCategoryGroup;
