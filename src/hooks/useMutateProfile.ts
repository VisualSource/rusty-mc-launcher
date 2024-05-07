import { useMutation, useQueryClient } from "@tanstack/react-query";
import profiles, { type MinecraftProfile } from "@lib/models/profiles";
import { PROFILES_KEY } from "./keys";
import logger from "@system/logger";

type RequestType = {
  type: "delete" | "patch" | "create";
  data: MinecraftProfile;
};

const mutateProfile = async (ev: RequestType) => {
  switch (ev.type) {
    case "create": {
      const result = await profiles.create({ data: ev.data });
      break;
    }
    case "delete": {
      await profiles.delete({
        where: [{ id: ev.data.id }],
      });
      break;
    }
    case "patch": {
      await profiles.update({
        data: ev.data,
        where: [{ id: ev.data.id }],
      });
      break;
    }
    default:
      break;
  }
};

export const useMutateProfiles = () => {
  const queryClient = useQueryClient();
  const mutate = useMutation({
    mutationFn: mutateProfile,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: [PROFILES_KEY] });
    },
  });

  return mutate;
};
