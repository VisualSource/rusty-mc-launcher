import { useQuery } from "@tanstack/react-query";

type VersionManifestV2 = {
	latest: { release: string; snapshot: string };
	versions: { id: string; type: string; releaseTime: string }[];
};
const cutoff_date = new Date("2020-06-23T16:20:52+00:00");

export type LoaderType = "fabric" | "forge" | "vanilla";

const useMinecraftVersions = (type: LoaderType = "vanilla") => {
	return useQuery<unknown, Error | Response, VersionManifestV2>({
		queryKey: [type, "versions"],
		queryFn: async (ctx) => {
			const id = ctx.queryKey[0];

			switch (id) {
				case "fabric": {
					const [versions, loaders] = await Promise.all([
						fetch("https://meta.fabricmc.net/v2/versions/game").then(
							(value) =>
								value.json() as Promise<{ version: string; stable: boolean }[]>,
						),
						fetch("https://meta.fabricmc.net/v2/versions/loader").then(
							(value) =>
								value.json() as Promise<
									{
										separator: string;
										build: string;
										maven: string;
										version: string;
										stable: boolean;
									}[]
								>,
						),
					]);

					const loader = loaders.find((value) => value.stable);

					const data = versions.map((value) => ({
						id: `fabric-loader-${loader?.version}-${value.version}`,
						type: value.stable ? "release" : "snapshot",
						releaseTime: "",
					}));

					const latest_stable = data.find((value) => value.type === "release");
					const latest_snapshot = data.find(
						(value) => value.type === "snapshot",
					);

					return {
						latest: {
							release: latest_stable,
							snapshot: latest_snapshot,
						},
						versions: data,
					};
				}
				default: {
					const version = await fetch(
						"https://launchermeta.mojang.com/mc/game/version_manifest_v2.json",
					).then((value) => value.json() as Promise<VersionManifestV2>);
					return {
						latest: version.latest,
						versions: [
							{ id: "latest-release", type: "latest-release", releaseTime: "" },
							{
								id: "latest-snapshot",
								type: "latest-snapshot",
								releaseTime: "",
							},
						].concat(
							version.versions.filter(
								(value) => new Date(value.releaseTime) >= cutoff_date,
							),
						),
					};
				}
			}
		},
	});
};

export default useMinecraftVersions;
