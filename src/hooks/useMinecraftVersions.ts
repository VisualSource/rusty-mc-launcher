import { useQuery } from "@tanstack/react-query";

export type VersionManifestV2 = {
	latest: { release: string; snapshot: string };
	versions: { id: string; type: string; releaseTime: string }[];
};
export type ReleaseType = "snapshot" | "release" | "both";

const MANIFEST_URL =
	"https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";
//const MINECRAFT_1_12_RELEASE = new Date("2017-06-02T13:50:27+00:00");

export const useMinecraftVersions = (type: ReleaseType) => {
	return useQuery({
		queryKey: ["minecraft", "versions", type],
		queryFn: async (args) => {
			const select = args.queryKey.at(2);
			const resposne = await fetch(MANIFEST_URL);

			const manifest = (await resposne.json()) as VersionManifestV2;

			const mc1_12 = manifest.versions.findIndex((e) => e.id === "1.13");
			if (mc1_12 === -1) throw new Error("Failed to find mc 1.13s");

			const versions = manifest.versions.slice(0, mc1_12 + 1);
			if (select === "both") {
				return versions;
			}

			return versions.filter((e) => e.type === select);
		},
	});
};
