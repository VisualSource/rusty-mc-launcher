import { useAccount, useMsal } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getMinecraftAccount } from "@lib/api/minecraftAccount";
import { startAuthServer, closeAuthServer } from "@system/commands";
import type { AccountInfo } from "@masl/index";

import getToken from "@lib/auth/getToken";
import { auth } from "@system/logger";

const useUser = () => {
	const msAccount = useAccount();
	const { instance } = useMsal();

	const mcAccount = useQuery({
		enabled: !!msAccount?.homeAccountId,
		queryKey: ["account", msAccount?.homeAccountId],
		queryFn: async (args) => {
			const accessToken = await getToken(instance, {
				scopes: ["XboxLive.SignIn", "XboxLive.offline_access"],
				extraQueryParameters: {
					response_type: "code",
				},
			});
			const id = args.queryKey.at(1);
			if (!id) throw new Error("Failed to get userid");
			return getMinecraftAccount(id, accessToken);
		},
	});

	const login = useCallback(async () => {
		let port = null;
		try {
			port = await startAuthServer();
			auth.trace(`Watching login port at: ${port}`);
			await instance.loginPopup({
				scopes: ["User.Read"],
				extraScopesToConsent: ["XboxLive.SignIn", "XboxLive.offline_access"],
				redirectUri: `http://localhost:${port}`,
				prompt: "select_account",
			});
		} finally {
			if (port !== null) closeAuthServer(port);
		}
	}, [instance]);

	const logout = useCallback(
		async (account: AccountInfo | null) => {
			if (!account) return;
			let port = null;
			try {
				port = await startAuthServer();
				auth.trace("Watching logout port at: %d", port);
				await instance.logoutPopup({
					postLogoutRedirectUri: `http://localhost:${port}`,
					account,
				});
			} finally {
				if (port !== null) closeAuthServer(port);
			}
		},
		[instance],
	);

	const refresh = useCallback(async () => {
		if (!msAccount?.homeAccountId) throw new Error("Invalid userid");
		const accessToken = await getToken(instance, {
			scopes: ["XboxLive.SignIn", "XboxLive.offline_access"],
			forceRefresh: true,
			extraQueryParameters: {
				response_type: "code",
			},
		});
		return getMinecraftAccount(msAccount.homeAccountId, accessToken);
	}, [instance, msAccount?.homeAccountId]);

	return {
		account: mcAccount.data,
		logout,
		login,
		refresh,
		isLoading: mcAccount.isLoading,
		isError: mcAccount.isError,
		error: mcAccount.error,
	};
};

export default useUser;
