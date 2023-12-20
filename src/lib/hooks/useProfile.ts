import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import profiles, { type MinecraftProfile } from "@lib/models/profiles";
import { useNavigate } from "react-router-dom";
import logger from "../system/logger";

type RequestType = { type: "patch"; data: Partial<MinecraftProfile> };
type RequestDelete = { type: "delete"; data: { id: string } };

const handleMutate = async (ev: RequestType | RequestDelete) => {
  if (ev.type === "patch") {
    await profiles.update({
      data: ev.data,
      where: [{ id: ev.data.id }],
    });
    return ev.data;
  }

  if (ev.type === "delete") {
    await profiles.delete({
      where: [{ id: ev.data.id }],
    });
    return null;
  }
};

export const useProfile = (id?: string, load: boolean = true) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isError, isLoading, error } = useQuery({
    enabled: !!id && load,
    queryKey: [id, "profile"],
    queryFn: async () => {
      logger.info(`Loading Profile ${id}`);
      const profile = await profiles.findOne({
        where: [{ id }],
      });
      logger.debug("Profile", profile);
      if (!profile) throw new Error("Failed to get minecraft profile");

      return profile;
    },
  });

  const mutate = useMutation({
    mutationFn: handleMutate,

    async onSuccess(data) {
      if (!data) {
        navigate("/library");
        return;
      }

      await queryClient.cancelQueries({ queryKey: [id, "profile"] });
      queryClient.setQueryData<MinecraftProfile>(
        [id, "profile"],
        (old) => data as MinecraftProfile,
      );
    },
  });

  return {
    mutate,
    profile: data,
    isError,
    isLoading,
    error,
  };
};
