import {
	exists,
	BaseDirectory,
	writeBinaryFile,
	createDir,
} from "@tauri-apps/api/fs";
import { resolve, appDataDir } from "@tauri-apps/api/path";
import { Client } from "@microsoft/microsoft-graph-client";
import { convertFileSrc } from "@tauri-apps/api/tauri";

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

export async function getAccountPhoto(client: Client, userId: string) {
	const etagKey = `${userId}.image.etag`;
	const etagSaved = localStorage.getItem(etagKey);

	const metadata = (await client.api(`/me/photo`).get()) as ImageMetadata;

	const etag = metadata["@odata.mediaEtag"]
		.replace("W/", "")
		.replaceAll('"', "");

	const appdir = await appDataDir();
	const imagepath = await resolve(appdir, "images", `${userId}_${etag}.jpeg`);
	const hasImage = await exists(imagepath, { dir: BaseDirectory.AppData });

	if (!hasImage || etag !== etagSaved) {
		const hasDir = await exists("images", { dir: BaseDirectory.AppData });
		if (!hasDir) await createDir("images", { dir: BaseDirectory.AppData });

		const imageRaw = (await client.api(`/me/photo/$value`).get()) as Blob;

		const buffer = await imageRaw.arrayBuffer();

		await writeBinaryFile(imagepath, [...new Uint8Array(buffer)], {
			dir: BaseDirectory.AppData,
		});

		localStorage.setItem(etagKey, etag);
	}

	return convertFileSrc(imagepath);
}
