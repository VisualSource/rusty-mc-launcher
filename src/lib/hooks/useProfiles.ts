import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import profiles, { type MinecraftProfile } from "@lib/models/profiles";
import logger from "@system/logger";
import { deleteProfile } from "../system/commands";

type RequestType = { type: "delete" | "patch" | "create", data: MinecraftProfile };

const KEY = "minecraft-profiles";

const fetchProfiles = async () => {
    const data = await profiles.find({});
    logger.debug("Fetch profiles", data);
    if (!data) throw new Error("Failed to get minecraft profiles");
    return data;
}

const mutateProfile = async (ev: RequestType) => {
    switch (ev.type) {
        case "create": {
            const result = await profiles.create({ data: ev.data });
            logger.log("Create Result", result);
            return ev.data;
        }
        case "delete": {
            await profiles.delete({
                where: [{ id: ev.data.id }]
            })
            return null;
        }
        case "patch": {
            await profiles.update({
                data: ev.data,
                where: [{ id: ev.data.id }]
            });
            return ev.data;
        }
        default:
            throw new Error("Not Implemented");
    }
}

export const useProfiles = () => {
    const queryClient = useQueryClient();
    const { data, isError, isLoading, error } = useQuery([KEY], fetchProfiles);
    const mutate = useMutation(mutateProfile, {
        async onSuccess(data, varablies) {
            await queryClient.cancelQueries([KEY]);
            if (!data) return;
            switch (varablies.type) {
                case "create": {
                    queryClient.setQueryData<MinecraftProfile[]>([KEY], (old) => {
                        if (!data || !old) return old;
                        return [data, ...old];
                    });
                    break;
                }
                case "delete": {
                    await deleteProfile(data.id);
                    queryClient.setQueryData<MinecraftProfile[]>([KEY], (old) => {
                        if (!old) return old;
                        return old.filter(value => value.id !== varablies.data.id);
                    });
                    break;
                }
                case "patch": {
                    queryClient.setQueryData<MinecraftProfile[]>([KEY], (old) => {
                        if (!old) return old;
                        const og = old.filter(value => value.id !== varablies.data.id);
                        return [data, ...og];
                    });
                    break;
                }
                default:
                    break;
            }
        }
    });

    return {
        mutate,
        profiles: data,
        isError,
        isLoading,
        error
    };
}