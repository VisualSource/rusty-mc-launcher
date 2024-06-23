import { useAccount, useMsal } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import { getGraphClient, getAccountPhoto } from "@lib/api/graphClient";
import { MSAL_AVATAR_KEY } from "./keys";

const FALL_BACK_AVATAR = "https://api.dicebear.com/5.x/initials/svg";

export const useAvatar = () => {
	const msAccount = useAccount();
	const { instance } = useMsal();
	const avatar = useQuery({
		enabled: !!msAccount?.homeAccountId,
		queryKey: [MSAL_AVATAR_KEY, msAccount?.homeAccountId],
		queryFn: async () => {
			if (!msAccount) throw new Error("No user account loggedin!");

			const { accessToken } = await instance.acquireTokenSilent({
				scopes: ["User.Read"],
			});
			const client = getGraphClient(accessToken);

			return getAccountPhoto(client, msAccount.homeAccountId).catch(
				(_) => `${FALL_BACK_AVATAR}?seed=${msAccount.homeAccountId}`,
			);
		},
	});

	return avatar;
};
