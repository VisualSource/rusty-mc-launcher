import { message } from "@tauri-apps/plugin-dialog";
import { compareAsc } from "date-fns/compareAsc";
import { addSeconds } from "date-fns/addSeconds";
import { fetch } from "@tauri-apps/plugin-http";

const MINECRAFT_LOGIN =
	"https://api.minecraftservices.com/authentication/login_with_xbox";
const MINECRAFT_PROFILE = "https://api.minecraftservices.com/minecraft/profile";
const XBOX_AUTHENTICATE = "https://user.auth.xboxlive.com/user/authenticate";
const LIVE_AUTHENTICATE = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MC_LOGIN_RELAY = "rp://api.minecraftservices.com/";
const XBOX_LIVE_RELAY = "http://auth.xboxlive.com";
const UNIX_EPOCH_DATE = new Date("1970-01-01T00:00:00Z");

export type Skin = {
	id: string;
	state: "ACTIVE" | "INACTIVE";
	url: string;
	variant: "CLASSIC" | "SLIM";
};

export type Cape = {
	alias: string;
	id: string;
	state: "ACTIVE" | "INACTIVE";
	url: string;
};

export type MinecraftAccount = {
	exp: string;
	xuid: string;
	token: {
		access_token: string;
	};
	details: {
		capes?: Cape[];
		id: string;
		name: string;
		skins: Skin[];
		profileActions: Record<string, unknown>;
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

	// #region Authenticate with Xbox Live.
	const authResponse = await fetch(XBOX_AUTHENTICATE, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			Properties: {
				AuthMethod: "RPS",
				SiteName: "user.auth.xboxlive.com",
				RpsTicket: `d=${accessToken}`,
			},
			RelyingParty: XBOX_LIVE_RELAY,
			TokenType: "JWT",
		}),
	});
	if (!authResponse.ok)
		throw new Error(authResponse.statusText, { cause: authResponse });
	const authRequest = (await authResponse.json()) as {
		Token: string;
		DisplayClaims: { xui: { uhs: string }[] };
	};

	const userHash = authRequest.DisplayClaims.xui.at(0)?.uhs;
	if (!userHash) throw new Error("Failed to get user hash");
	const xboxToken = authRequest.Token;
	// #endregion

	// #region Authenticate with XSTS
	const liveResponse = await fetch(LIVE_AUTHENTICATE, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			Properties: {
				SandboxId: "RETAIL",
				UserTokens: [xboxToken],
			},
			RelyingParty: MC_LOGIN_RELAY,
			TokenType: "JWT",
		}),
	});
	if (!liveResponse.ok)
		throw new Error(liveResponse.statusText, { cause: liveResponse });
	const liveToken = await liveResponse
		.json()
		.then((e) => (e as { Token: string }).Token);
	// #endregion

	// #region Authenticate with minecraft

	const mclResponse = await fetch(MINECRAFT_LOGIN, {
		method: "POST",
		body: JSON.stringify({
			identityToken: `XBL3.0 x=${userHash};${liveToken}`,
		}),
		headers: {
			"Content-Type": "application/json",
		},
	});
	if (!mclResponse.ok)
		throw new Error(mclResponse.statusText, { cause: mclResponse });
	const access_token = await mclResponse
		.json()
		.then((e) => (e as { access_token: string }).access_token);

	const jwt = JSON.parse(atob(access_token.split(".")[1])) as {
		xuid: string;
		exp: number;
	};
	const expDate = addSeconds(UNIX_EPOCH_DATE, jwt.exp).toISOString();
	// #endregion

	//#region Get Minecraft Profile

	const profileResponse = await fetch(MINECRAFT_PROFILE, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	});
	if (!profileResponse.ok)
		throw new Error(profileResponse.statusText, { cause: profileResponse });
	const profile = (await profileResponse.json()) as
		| MinecraftAccount["details"]
		| { path: string; error: string; errorMessage: string };

	if ("error" in profile) {
		await message(
			"Current Microsoft account does not have a minecraft account",
			{ title: "Minecraft Login", kind: "error" },
		);
		throw new Error("Current account does not have a minecraft account!");
	}

	//#endregion

	const mcprofile: MinecraftAccount = {
		exp: expDate,
		xuid: jwt.xuid,
		token: {
			access_token,
		},
		details: profile,
	};

	localStorage.setItem(key, JSON.stringify(profile));

	return mcprofile;
}
