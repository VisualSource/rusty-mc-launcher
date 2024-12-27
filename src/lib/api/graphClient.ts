/** @deprecated */

import { exists, BaseDirectory, create, mkdir } from "@tauri-apps/plugin-fs";
import { resolve, appDataDir } from "@tauri-apps/api/path";
import { Client } from "@microsoft/microsoft-graph-client";
import { convertFileSrc } from "@tauri-apps/api/core";

/**
 * @deprecated
 * @param accessToken
 * @returns
 */
export const getGraphClient = (accessToken: string) => {
	const graphClient = Client.init({
		authProvider: (done) => done(null, accessToken),
	});
	return graphClient;
};

export type ImageSize =
	| "48x48"
	| "64x64"
	| "96x96"
	| "120x120"
	| "240x240"
	| "360x360"
	| "432x432"
	| "504x504"
	| "648x648";

export type ImageMetadata = {
	"@odata.context": string;
	"@odata.id": string;
	"@odata.mediaContentType": string;
	"@odata.mediaEtag": string;
	id: ImageSize | "1x1";
	width: number;
	height: number;
};

/** @deprecated */
export async function getAccountPhoto(client: Client, userId: string) {
	const etagKey = `${userId}.image.etag`;
	const etagSaved = localStorage.getItem(etagKey);

	const metadata = (await client.api("/me/photo").get()) as ImageMetadata;

	const etag = metadata["@odata.mediaEtag"]
		.replace("W/", "")
		.replaceAll('"', "");

	const appdir = await appDataDir();
	const imagepath = await resolve(appdir, "images", `${userId}_${etag}.jpeg`);
	const hasImage = await exists(imagepath, { baseDir: BaseDirectory.AppData });

	if (!hasImage || etag !== etagSaved) {
		const hasDir = await exists("images", { baseDir: BaseDirectory.AppData });
		if (!hasDir) await mkdir("images", { baseDir: BaseDirectory.AppData });

		const imageRaw = (await client.api("/me/photo/$value").get()) as Blob;

		const buffer = await imageRaw.arrayBuffer();

		const file = await create(imagepath, { baseDir: BaseDirectory.AppData });

		await file.write(new Uint8Array(buffer));
		await file.close();

		localStorage.setItem(etagKey, etag);
	}

	return convertFileSrc(imagepath);
}
