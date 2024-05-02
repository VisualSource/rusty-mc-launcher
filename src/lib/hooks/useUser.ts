import { useAccount, useMsal, } from '@azure/msal-react';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getGraphClient, getAccountPhoto } from '@lib/api/graphClient';
import { getMinecraftAccount } from "@lib/api/minecraftAccount";
import { PortGenerator } from '@system/commands';
import { InteractionStatus } from "@masl/index";
import getToken from '../auth/getToken';
import { xboxRequest } from '../auth/loginRequests';

const useUser = () => {
  const account = useAccount();
  const { instance, inProgress } = useMsal();

  const { isLoading, isError, error, data } = useQuery({
    enabled: !!account?.homeAccountId,
    queryKey: ["account", account?.homeAccountId],
    retry: 4,
    queryFn: async () => {
      if (!account) throw new Error("No user account loggedin!");

      const { accessToken } = await instance.acquireTokenSilent({
        scopes: ["User.Read"],
      });
      const client = getGraphClient(accessToken);

      const xbAccessToken = await getToken(instance, xboxRequest);

      const [userResult, imageResult] = await Promise.allSettled([
        getMinecraftAccount(account.homeAccountId, xbAccessToken),
        getAccountPhoto(client, account.homeAccountId)
      ]);

      if (userResult.status === "rejected") throw userResult.reason;
      const image_path = imageResult.status === "fulfilled" ? imageResult.value : `https://api.dicebear.com/5.x/initials/svg?seed=${account.homeAccountId}`;

      return { image: image_path, account: userResult.value }
    }
  });

  const login = useCallback(async () => {
    const port = PortGenerator.getInstance().setPort();

    await instance.loginPopup({
      scopes: ["User.Read"],
      extraScopesToConsent: ["XboxLive.SignIn", "XboxLive.offline_access"],
      redirectUri: `http://localhost:${port}`,
      prompt: "select_account"
    });
  }, [instance]);

  const logout = useCallback(async () => {
    const port = PortGenerator.getInstance().setPort();
    await instance.logoutPopup({
      postLogoutRedirectUri: `http://localhost:${port}`,
    })
  }, [instance]);

  return {
    account,
    minecraft: data?.account,
    avatar: data?.image,
    logout,
    login,
    isLoading: isLoading || inProgress !== InteractionStatus.None,
    isError,
    error
  };
}

export default useUser;



/*import {
  AuthCodeMSALBrowserAuthenticationProvider,
  type AuthCodeMSALBrowserAuthenticationProviderOptions,
} from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import {
  PublicClientApplication,
  InteractionType,
  type AccountInfo,
  IPublicClientApplication,
} from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";
import { useMsal, useAccount } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";
import { addSeconds } from "date-fns/addSeconds";
import localforage from "localforage";
import { useCallback } from "react";

import { getUserAccountProfile, type MicrosoftProfile } from '@lib/user/getUserAccountProfile';
import getMinecraftAccount, { type MinecraftAccount } from "@auth/minecraft_login_flow";
import { getUserAccountAvatar } from '@/lib/user/getUserAccountAvatar';
import { PortGenerator } from "@lib/system/commands";
import { loginRequest } from "@lib/config/auth";
import logger from "@system/logger";

export interface UserAccount extends MicrosoftProfile {
  photo: string;
  minecraft: MinecraftAccount | null;
}*/

/** 
 * Seconds Since the Epoch
 * @type {Date}
 * @link https://stackoverflow.com/questions/39926104/what-format-is-the-exp-expiration-time-claim-in-a-jwt
 */
/*const UNIX_EPOCH_DATE = new Date("1970-01-01T00:00:00Z");

const fetchProfile = async (instance: IPublicClientApplication, id: string) => {
  const profile = await getMinecraftAccount(instance);
  localforage.setItem(id, profile);
  return profile;
};

const getMinecraftProfile = async (
  account: AccountInfo | null,
  instance: IPublicClientApplication,
) => {
  if (!account)
    throw new Error("No user account selected to fetch minecraft profile.");
  const id = `${account.nativeAccountId ?? account.homeAccountId}-minecraft`;
  const data = await localforage.getItem<MinecraftAccount | null>(id);

  if (!data) {
    logger.info("No user token found. Fetching token.");
    return fetchProfile(instance, id);
  }

  const token = JSON.parse(atob(data.token.access_token.split(".")[1])) as {
    exp: number;
  };

  const expiration_time = addSeconds(UNIX_EPOCH_DATE, token.exp);
  if (new Date() >= expiration_time) {
    logger.info("User token expired, Fetching new token.");
    return fetchProfile(instance, id);
  }

  logger.info("User token up to date, Proceding.");

  return data;
};*/

/**
 * Minecraft Login flow python impl 
 * @see https://codeberg.org/JakobDev/minecraft-launcher-lib/src/branch/master/minecraft_launcher_lib
 * 
 * @return {*} 
 */
/*const useUser = () => {
  const account = useAccount();
  const { instance } = useMsal();
  const { data, isError, isLoading, error } = useQuery({
    enabled: !!account,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    queryKey: ["user", account?.nativeAccountId],
    queryFn: async () => {
      const options: AuthCodeMSALBrowserAuthenticationProviderOptions = {
        account: account as AccountInfo, // the AccountInfo instance to acquire the token for.
        interactionType: InteractionType.Silent, // msal-browser InteractionType
        scopes: ["user.read"], // example of the scopes to be passed
      };

      const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(
        instance as PublicClientApplication,
        options,
      );
      const client = Client.initWithMiddleware({ authProvider });

      const [profile, photo, minecraft] = await Promise.allSettled([
        getUserAccountProfile(account as AccountInfo, client),
        getUserAccountAvatar(account as AccountInfo, client),
        getMinecraftProfile(account, instance),
      ]);

      const user: UserAccount =
        profile.status === "fulfilled" ? profile.value : {};
      user.photo = photo.status === "fulfilled" ? photo.value : "";
      user.minecraft =
        minecraft.status === "fulfilled" ? minecraft.value : null;

      return user;
    },
  });

  const login = useCallback(async () => {
    const port = PortGenerator.getInstance().setPort();
    logger.debug("Auth Port", port);
    await instance.loginPopup({
      ...loginRequest,
      redirectUri: `http://localhost:${port}`,
    });
  }, [instance]);

  const logout = useCallback(async () => {
    const port = PortGenerator.getInstance().setPort();
    logger.debug("Auth Port", port);

    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: `http://localhost:${port}`,
      });
    } catch (error) {
      logger.error(error);
    }
  }, [instance]);

  return {
    logout,
    login,
    minecraft: (fresh: boolean = false) =>
      getMinecraftProfile(account, instance),
    user: data,
    isLoading,
    isError,
    error,
    account,
    instance,
  };
};

export default useUser;*/
