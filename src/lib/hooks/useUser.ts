import { useAccount, useMsal } from "@azure/msal-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { getMinecraftAccount } from "@lib/api/minecraftAccount";
import { xboxRequest } from "../auth/loginRequests";
import { PortGenerator } from "@system/commands";
import { IPublicClientApplication, InteractionStatus } from "@masl/index";
import getToken from "../auth/getToken";


const getAccount = async (instance: IPublicClientApplication, userId: string | undefined) => {
  if (!userId) throw new Error("Invalid userid");
  const accessToken = await getToken(instance, xboxRequest);
  return getMinecraftAccount(userId, accessToken);
}

const useUser = () => {
  const msAccount = useAccount();
  const { instance, inProgress } = useMsal();

  const mcAccount = useQuery({
    enabled: !!msAccount?.homeAccountId,
    queryKey: ["account", msAccount?.homeAccountId],
    queryFn: async (args) => {
      const key = args.queryKey.at(1);
      return getAccount(instance, key);
    }
  });

  const login = useCallback(async () => {
    const port = PortGenerator.getInstance().setPort();

    await instance.loginPopup({
      scopes: ["User.Read"],
      extraScopesToConsent: ["XboxLive.SignIn", "XboxLive.offline_access"],
      redirectUri: `http://localhost:${port}`,
      prompt: "select_account",
    });
  }, [instance]);

  const logout = useCallback(async () => {
    const port = PortGenerator.getInstance().setPort();
    await instance.logoutPopup({
      postLogoutRedirectUri: `http://localhost:${port}`,
    });
  }, [instance]);

  const getMinecraftAccount = useCallback(() => getAccount(instance, msAccount?.homeAccountId), [msAccount?.homeAccountId, instance])

  return {
    account: mcAccount.data,
    logout,
    login,
    getMinecraftAccount,
    isLoading: mcAccount.isLoading || inProgress !== InteractionStatus.None,
    isError: mcAccount.isError,
    error: mcAccount.error,
  };
};

export default useUser;