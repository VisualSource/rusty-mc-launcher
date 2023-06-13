import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import profiles, { type MinecraftProfile } from "@lib/models/profiles";
import { useNavigate } from "react-router-dom";
import logger from "../system/logger";

type RequestType = { type: "patch", data: Partial<MinecraftProfile> };
type RequestDelete = { type: "delete", data: { id: string; } }

const handleMutate = async (ev: RequestType | RequestDelete) => {

    if (ev.type === "patch") {
        await profiles.update({
            data: ev.data,
            where: [{ id: ev.data.id }]
        });
        return ev.data;
    }

    if (ev.type === "delete") {
        await profiles.delete({
            where: [{ id: ev.data.id }]
        });
        return null;
    }

}

export const useProfile = (id?: string) => {
    const navigate = useNavigate()
    const queryClient = useQueryClient();
    const { data, isError, isLoading, error } = useQuery([id, "profile"], async () => {
        logger.info(`Loading Profile ${id}`);
        const profile = await profiles.find({
            where: [{ id }]
        });
        logger.debug("Profile", profile);
        if (!profile || !profile[0]) throw new Error("Failed to get minecraft profile");

        return profile.at(0);
    }, { enabled: !!id });

    const mutate = useMutation(handleMutate, {
        async onSuccess(data, varablies) {
            if (!data) {
                navigate("/library")
                return;
            }

            await queryClient.cancelQueries([id, "profile"]);
            queryClient.setQueryData<MinecraftProfile>([id, "profile"], (old) => data as MinecraftProfile);
        }
    });

    return {
        mutate,
        profile: data,
        isError,
        isLoading,
        error
    }
}