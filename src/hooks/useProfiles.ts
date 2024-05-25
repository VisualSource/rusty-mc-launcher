import { useSuspenseQuery } from "@tanstack/react-query";
import { profile } from "@/lib/models/profiles";
import { PROFILES_KEY } from "./keys";
import { db } from "@system/commands";

export const useProfiles = () => {
  const { data, error } = useSuspenseQuery({
    queryKey: [PROFILES_KEY],
    queryFn: () =>
      db.select({ query: "SELECT * FROM profiles", schema: profile.schema }),
  });

  if (error) throw error;

  return data;
};
