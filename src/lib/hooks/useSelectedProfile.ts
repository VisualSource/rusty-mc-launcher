import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MinecraftProfile } from "@lib/models/profiles";
import profiles from "@lib/models/profiles";
import logger from "../system/logger";

const ACTIVE_KEY = "active-profile";

const getSelected = async () => {
    const data = await profiles.find({
        where: [{ active: true }],
        limit: 1
    });

    logger.debug(data);

    if (!data) return null;
    return data[0] ?? null;
}

const handleMutation = async (ev: { type: "set" | "unset", data: string }) => {
    if (ev.type === "set") {
        await profiles.update({ data: { active: false }, where: [{ active: true }] });
        await profiles.update({ data: { active: true }, where: [{ id: ev.data }] });
        const profile = await profiles.find({ where: [{ id: ev.data }], limit: 1 });
        if (!profile || !profile.length) throw new Error("Failed to get profile");
        return profile[0]
    }

    throw new Error("Failed to get profile");
}

export const useSelectedProfile = () => {
    const queryClient = useQueryClient();
    const { data, error, isLoading } = useQuery([ACTIVE_KEY], getSelected);
    const mutate = useMutation<MinecraftProfile, Error, { type: "set" | "unset", data: string }>(handleMutation, {
        async onSuccess(data) {
            await queryClient.cancelQueries([ACTIVE_KEY]);
            queryClient.setQueryData([ACTIVE_KEY], data);
        },
    });

    return {
        selected: data,
        isLoading,
        error,
        mutate
    }
}