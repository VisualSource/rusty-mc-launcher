import { useAccount, useMsal } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import { getGraphClient, getAccountPhoto } from "@lib/api/graphClient";

export const useAvatar = () => {
    const msAccount = useAccount();
    const { instance } = useMsal();
    const avatar = useQuery({
        enabled: !!msAccount?.homeAccountId,
        queryKey: ["avatar", msAccount?.homeAccountId],
        queryFn: async () => {
            if (!msAccount) throw new Error("No user account loggedin!");

            const { accessToken } = await instance.acquireTokenSilent({
                scopes: ["User.Read"],
            });
            const client = getGraphClient(accessToken);

            return getAccountPhoto(client, msAccount.homeAccountId).catch(e => `https://api.dicebear.com/5.x/initials/svg?seed=${msAccount.homeAccountId}`);
        }
    })

    return avatar;
}
