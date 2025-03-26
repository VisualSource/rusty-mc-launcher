// Minecraft xbox login endpoint
export const MINECRAFT_LOGIN =
	"https://api.minecraftservices.com/authentication/login_with_xbox";
// Minecraft profile endpoint
export const MINECRAFT_PROFILE =
	"https://api.minecraftservices.com/minecraft/profile";
// Xbox authentication endpoint
export const XBOX_AUTHENTICATE =
	"https://user.auth.xboxlive.com/user/authenticate";
// Xbox live authorize endpoint
export const LIVE_AUTHENTICATE =
	"https://xsts.auth.xboxlive.com/xsts/authorize";
// xbox minecraft login relay
export const MC_LOGIN_RELAY = "rp://api.minecraftservices.com/";
// xbox live relay
export const XBOX_LIVE_RELAY = "http://auth.xboxlive.com";
// UNIX EPOCH
export const UNIX_EPOCH_DATE = new Date("1970-01-01T00:00:00Z");
// UUID hex digits
const UUID_CHARS = "0123456789abcdef";
// Array to store UINT32 random value
const UINT32_ARR = new Uint32Array(1);

/**
 * Returns random Uint32 value.
 * @returns {number}
 */
function getRandomUint32(): number {
	window.crypto.getRandomValues(UINT32_ARR);
	return UINT32_ARR[0];
}

/**
 * Creates a UUID v7 from the current timestamp.
 * Implementation relies on the system clock to guarantee increasing order of generated identifiers.
 * @returns {number}
 */
export function createNewGuid(): string {
	const currentTimestamp = Date.now();
	const baseRand = getRandomUint32() * 0x400 + (getRandomUint32() & 0x3ff);

	// Result byte array
	const bytes = new Uint8Array(16);
	// A 12-bit `rand_a` field value
	const randA = Math.trunc(baseRand / 2 ** 30);
	// The higher 30 bits of 62-bit `rand_b` field value
	const randBHi = baseRand & (2 ** 30 - 1);
	// The lower 32 bits of 62-bit `rand_b` field value
	const randBLo = getRandomUint32();

	bytes[0] = currentTimestamp / 2 ** 40;
	bytes[1] = currentTimestamp / 2 ** 32;
	bytes[2] = currentTimestamp / 2 ** 24;
	bytes[3] = currentTimestamp / 2 ** 16;
	bytes[4] = currentTimestamp / 2 ** 8;
	bytes[5] = currentTimestamp;
	bytes[6] = 0x70 | (randA >>> 8);
	bytes[7] = randA;
	bytes[8] = 0x80 | (randBHi >>> 24);
	bytes[9] = randBHi >>> 16;
	bytes[10] = randBHi >>> 8;
	bytes[11] = randBHi;
	bytes[12] = randBLo >>> 24;
	bytes[13] = randBLo >>> 16;
	bytes[14] = randBLo >>> 8;
	bytes[15] = randBLo;

	let text = "";
	for (let i = 0; i < bytes.length; i++) {
		text += UUID_CHARS.charAt(bytes[i] >>> 4);
		text += UUID_CHARS.charAt(bytes[i] & 0xf);
		if (i === 3 || i === 5 || i === 7 || i === 9) {
			text += "-";
		}
	}
	return text;
}
