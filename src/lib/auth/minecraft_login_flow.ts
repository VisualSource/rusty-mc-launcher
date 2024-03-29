import { getClient, Body, ResponseType } from "@tauri-apps/api/http";
import type { IPublicClientApplication } from "@azure/msal-browser";
import { xboxRequest } from "@lib/config/auth";
import getToken from "@lib/auth/getToken";

type XboxLiveAuthenticationResponse = {
  Token: string;
  DisplayClaims: {
    xui: { uhs: string }[];
  };
}

type MinecraftProfileResponse = {
  capes?: {
    alias: string;
    id: string;
    state: string;
    url: string;
  }[];
  id: string;
  name: string;
  skins: {
    id: string;
    state: string;
    url: string;
    variant: string;
  }[];
  profileActions: {};
}

const getMinecraftAccount = async (instance: IPublicClientApplication) => {
  const token = await getToken(instance, xboxRequest);

  const httpClient = await getClient();

  const { data: xbox_resp } = await httpClient.post<XboxLiveAuthenticationResponse>(
    "https://user.auth.xboxlive.com/user/authenticate",
    Body.json({
      Properties: {
        AuthMethod: "RPS",
        SiteName: "user.auth.xboxlive.com",
        RpsTicket: `d=${token.accessToken}`,
      },
      RelyingParty: "http://auth.xboxlive.com",
      TokenType: "JWT",
    }),
    { responseType: ResponseType.JSON },
  );

  const userHash = xbox_resp.DisplayClaims.xui.at(0)?.uhs;
  const xboxToken = xbox_resp.Token;

  const { data: xbox_security_token_resp } =
    await httpClient.post<XboxLiveAuthenticationResponse>(
      "https://xsts.auth.xboxlive.com/xsts/authorize",
      Body.json({
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [xboxToken],
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT",
      }),
      {
        responseType: ResponseType.JSON,
      },
    );

  const xbox_security_token = xbox_security_token_resp.Token;

  const { data: minecraft_resp } =
    await httpClient.post<{ access_token: string; }>(
      "https://api.minecraftservices.com/authentication/login_with_xbox",
      Body.json({
        identityToken: `XBL3.0 x=${userHash};${xbox_security_token}`,
      }),
      {
        responseType: ResponseType.JSON,
      },
    );

  const xuid = JSON.parse(atob(minecraft_resp.access_token.split(".")[1])) as {
    xuid: string;
  };

  const { data: mcp } = await httpClient.get<MinecraftProfileResponse>(
    "https://api.minecraftservices.com/minecraft/profile",
    {
      headers: {
        Authorization: `Bearer ${minecraft_resp.access_token}`,
      },
      responseType: ResponseType.JSON,
    },
  );

  return {
    xuid: xuid.xuid,
    fetched: new Date(),
    profile: mcp,
    token: minecraft_resp,
  };
};

export type MinecraftAccount = Awaited<ReturnType<typeof getMinecraftAccount>>;

export default getMinecraftAccount;
