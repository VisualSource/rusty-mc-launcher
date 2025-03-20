import { useMsal, useMsalAuthentication } from "@azure/msal-react";
import { InteractionStatus, InteractionType } from "@azure/msal-browser";
import { useCallback } from "react";
import type { Account } from "@/lib/models/account";

const useUser = () => {
	const { acquireToken, login, result, error } = useMsalAuthentication(InteractionType.Popup, {
		scopes: ["XboxLive.SignIn", "XboxLive.offline_access"],
		prompt: "select_account",
	});
	const { instance, inProgress } = useMsal();

	const logout = useCallback(
		async () => {
			await instance.logoutPopup().catch(e => console.error(e));
		},
		[instance],
	);

	return {
		account: (result?.account ?? null) as Account | null,
		acquireToken,
		logout,
		login,
		error,
		isLoading: (inProgress === InteractionStatus.Login) || (inProgress === InteractionStatus.Startup),
	};
};

export default useUser;