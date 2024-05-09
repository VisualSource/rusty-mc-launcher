import { useSuspenseQuery } from "@tanstack/react-query";
//import profiles from "@lib/models/profiles";
import { PROFILES_KEY } from "./keys";
import logger from "@system/logger";

/*const fetchProfiles = async () => {
  const data = await profiles.find({});
  logger.debug("Fetch profiles", data);
  if (!data) throw new Error("Failed to get minecraft profiles");
  return data;
};*/

export const useProfiles = () => {
  const { data, error } = useSuspenseQuery({
    queryKey: [PROFILES_KEY],
    queryFn: async () => {
      return [];
    },
  });

  if (error) throw error;

  return data;
};
