import { getClient, Body, ResponseType } from '@tauri-apps/api/http';
import { compareAsc } from 'date-fns/compareAsc';
import { addSeconds } from "date-fns/addSeconds";
import getToken from '../auth/getToken';

const MINECRAFT_LOGIN = "https://api.minecraftservices.com/authentication/login_with_xbox";
const MINECRAFT_PROFILE = "https://api.minecraftservices.com/minecraft/profile";
const XBOX_AUTHENTICATE = "https://user.auth.xboxlive.com/user/authenticate";
const LIVE_AUTHENTICATE = "https://xsts.auth.xboxlive.com/xsts/authorize";
const UNIX_EPOCH_DATE = new Date("1970-01-01T00:00:00Z");

export type MinecraftAccount = {
    exp: string;
    xuid: string;
    token: {
        access_token: string;
    }
    account: {
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
};

export async function getMinecraftAccount(userId: string, accessToken: string): Promise<MinecraftAccount> {
    const key = `${userId}.minecraft.profile`;
    const raw = localStorage.getItem(key);

    if (raw) {
        const data = JSON.parse(raw) as MinecraftAccount;
        if (compareAsc(new Date(), data.exp) === -1) {
            return data;
        }
    }
    const http = await getClient();

    // #region Xbox Login
    const authRequest = await http.post<{ Token: string; DisplayClaims: { xui: { uhs: string }[] } }>(XBOX_AUTHENTICATE, Body.json({
        Properties: {
            AuthMethod: "RPS",
            SiteName: "user.auth.xboxlive.com",
            RpsTicket: `d=${accessToken}`,
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT",
    }), { responseType: ResponseType.JSON });

    console.log(authRequest.data);

    const userHash = authRequest.data.DisplayClaims.xui.at(0)?.uhs;
    if (!userHash) throw new Error("Failed to get user hash");
    const xboxToken = authRequest.data.Token;
    // #endregion

    // #region Minecraft Login
    const liveRequest = await http.post<{ Token: string; }>(LIVE_AUTHENTICATE, Body.json({
        Properties: {
            SandboxId: "RETAIL",
            UserTokens: [xboxToken],
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT",
    }), { responseType: ResponseType.JSON });

    const liveToken = liveRequest.data.Token;
    // #endregion

    // #region Get Minecraft Token
    const minecraftLoginRequest = await http.post<{ access_token: string }>(MINECRAFT_LOGIN, Body.json({
        identityToken: `XBL3.0 x=${userHash};${liveToken}`,
    }), { responseType: ResponseType.JSON });
    const jwt = JSON.parse(atob(minecraftLoginRequest.data.access_token.split(".")[1])) as { xuid: string; exp: number; }
    const expDate = addSeconds(UNIX_EPOCH_DATE, jwt.exp).toISOString();
    // #endregion

    //#region Get Minecraft Profile
    const userProfile = await http.get<MinecraftAccount["account"]>(MINECRAFT_PROFILE, {
        headers: {
            Authorization: `Bearer ${minecraftLoginRequest.data.access_token}`,
        },
        responseType: ResponseType.JSON
    });
    //#endregion

    const profile: MinecraftAccount = {
        exp: expDate,
        xuid: jwt.xuid,
        token: minecraftLoginRequest.data,
        account: userProfile.data
    };

    localStorage.setItem(key, JSON.stringify(profile));

    return profile;
}