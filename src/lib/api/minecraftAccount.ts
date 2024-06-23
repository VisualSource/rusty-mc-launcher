import { getClient, Body, ResponseType } from "@tauri-apps/api/http";
import { compareAsc } from "date-fns/compareAsc";
import { addSeconds } from "date-fns/addSeconds";
import { auth } from "@system/logger";
import { message } from "@tauri-apps/api/dialog";

const MINECRAFT_LOGIN =
	"https://api.minecraftservices.com/authentication/login_with_xbox";
const MINECRAFT_PROFILE = "https://api.minecraftservices.com/minecraft/profile";
const XBOX_AUTHENTICATE = "https://user.auth.xboxlive.com/user/authenticate";
const LIVE_AUTHENTICATE = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MC_LOGIN_RELAY = "rp://api.minecraftservices.com/";
const XBOX_LIVE_RELAY = "http://auth.xboxlive.com";
const UNIX_EPOCH_DATE = new Date("1970-01-01T00:00:00Z");

export type MinecraftAccount = {
	exp: string;
	xuid: string;
	token: {
		access_token: string;
	};
	details: {
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
	};
};

/**
 * @see https://wiki.vg/Microsoft_Authentication_Scheme
 *
 * @export
 * @param {string} userId
 * @param {string} accessToken
 * @return {*}  {Promise<MinecraftAccount>}
 */
export async function getMinecraftAccount(
	userId: string,
	accessToken: string,
): Promise<MinecraftAccount> {
	const key = `${userId}.profile.minecraft`;
	const raw = localStorage.getItem(key);

	if (raw) {
		const data = JSON.parse(raw) as MinecraftAccount;
		if (compareAsc(new Date(), data.exp) === -1) {
			return data;
		}
	}
	const http = await getClient();

	// #region Authenticate with Xbox Live.
	auth.info("Authenticate With Xbox Live");
	const authRequest = await http.post<{
		Token: string;
		DisplayClaims: { xui: { uhs: string }[] };
	}>(
		XBOX_AUTHENTICATE,
		Body.json({
			Properties: {
				AuthMethod: "RPS",
				SiteName: "user.auth.xboxlive.com",
				RpsTicket: `d=${accessToken}`,
			},
			RelyingParty: XBOX_LIVE_RELAY,
			TokenType: "JWT",
		}),
		{ responseType: ResponseType.JSON },
	);

	const userHash = authRequest.data.DisplayClaims.xui.at(0)?.uhs;
	if (!userHash) throw new Error("Failed to get user hash");
	const xboxToken = authRequest.data.Token;
	// #endregion

	// #region Authenticate with XSTS
	auth.info("Authenticate with XSTS");
	const liveRequest = await http.post<{ Token: string }>(
		LIVE_AUTHENTICATE,
		Body.json({
			Properties: {
				SandboxId: "RETAIL",
				UserTokens: [xboxToken],
			},
			RelyingParty: MC_LOGIN_RELAY,
			TokenType: "JWT",
		}),
		{ responseType: ResponseType.JSON },
	);

	const liveToken = liveRequest.data.Token;
	// #endregion

	// #region Authenticate with minecraft
	auth.info("Authenticate with minecraft");
	const minecraftLoginRequest = await http.post<{ access_token: string }>(
		MINECRAFT_LOGIN,
		Body.json({
			identityToken: `XBL3.0 x=${userHash};${liveToken}`,
		}),
		{ responseType: ResponseType.JSON },
	);

	const jwt = JSON.parse(
		atob(minecraftLoginRequest.data.access_token.split(".")[1]),
	) as { xuid: string; exp: number };
	const expDate = addSeconds(UNIX_EPOCH_DATE, jwt.exp).toISOString();
	// #endregion

	//#region Get Minecraft Profile
	auth.info("Fetching minecraft profile");
	const userProfile = await http.get<
		| MinecraftAccount["details"]
		| { path: string; error: string; errorMessage: string }
	>(MINECRAFT_PROFILE, {
		headers: {
			Authorization: `Bearer ${minecraftLoginRequest.data.access_token}`,
		},
		responseType: ResponseType.JSON,
	});

	if (!userProfile.ok) throw new Error("Failed to load minecraft profile");

	if ("error" in userProfile) {
		await message(
			"Current Microsoft account does not have a minecraft account",
			{ title: "Minecraft Login", type: "error" },
		);
		throw new Error("Current account does not have a minecraft account!");
	}

	//#endregion

	const profile: MinecraftAccount = {
		exp: expDate,
		xuid: jwt.xuid,
		token: minecraftLoginRequest.data,
		details: userProfile.data as MinecraftAccount["details"],
	};

	localStorage.setItem(key, JSON.stringify(profile));

	return profile;
}
