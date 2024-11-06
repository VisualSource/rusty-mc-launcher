import { ErrorComponent, createLazyFileRoute } from "@tanstack/react-router";
import { fetch } from "@tauri-apps/plugin-http";
import { memo, useEffect, useReducer, useRef } from "react";
import { downloadDir, sep } from "@tauri-apps/api/path";
import { SkinViewer, IdleAnimation } from "skinview3d";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useMutation } from "@tanstack/react-query";
import { readFile } from "@tauri-apps/plugin-fs";
import { useAccount } from "@azure/msal-react";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "react-toastify";
import { Plus } from "lucide-react";

import type { Cape, MinecraftAccount, Skin } from "@/lib/api/minecraftAccount";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/api/queryClient";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Label } from "@/components/ui/label";
import useUser from "@/hooks/useUser";
import logger from "@system/logger";
import { cn } from "@/lib/utils";

type Content = {
	isReady: boolean;
	skins: Skin[];
	capes: Cape[];
};

type Action =
	| { type: "SET_SLIM"; value: boolean; id: string }
	| { type: "SET_SKIN"; id: string; state: "ACTIVE" | "INACTIVE" }
	| { type: "SET_CAPE"; id: string; state: "ACTIVE" | "INACTIVE" }
	| { type: "ADD_SKIN"; url: string }
	| { type: "INIT"; skins: Skin[]; capes: Cape[] };

const MINECRAFT_API_CAPE =
	"https://api.minecraftservices.com/minecraft/profile/capes/active";
const MINECRAFT_API_SKIN =
	"https://api.minecraftservices.com/minecraft/profile/skins";
const DEFAULT_NAMES = [
	"X-Steve",
	"X-Alex",
	"X-Ari",
	"X-Efe",
	"X-Kai",
	"X-Makena",
	"X-Noor",
	"X-Sunny",
	"X-Zuri",
] as const;

const isUpload = (url: string): boolean => {
	return (
		url.startsWith("https://asset.localhost") || url.startsWith("asset://")
	);
};

const reducer = (state: Content, payload: Action) => {
	switch (payload.type) {
		case "SET_SLIM": {
			const skin = state.skins.find((e) => e.id === payload.id);
			if (skin) {
				skin.variant = payload.value ? "SLIM" : "CLASSIC";
			}

			return { ...state };
		}
		case "SET_SKIN": {
			for (const skin of state.skins) {
				skin.state = "INACTIVE";
			}
			const skin = state.skins.find((e) => e.id === payload.id);
			if (skin) skin.state = "ACTIVE";

			return { ...state, skins: [...state.skins] };
		}
		case "SET_CAPE": {
			for (const cape of state.capes) {
				cape.state = "INACTIVE";
			}

			const cape = state.capes.find((e) => e.id === payload.id);
			if (cape) cape.state = payload.state;

			return { ...state };
		}
		case "INIT": {
			return { isReady: true, skins: payload.skins, capes: payload.capes };
		}
		case "ADD_SKIN": {
			for (const skin of state.skins) {
				skin.state = "INACTIVE";
			}

			return {
				...state,
				skins: [
					...state.skins,
					{
						url: payload.url,
						id: crypto.randomUUID(),
						variant: "CLASSIC",
						state: "ACTIVE",
					} as Skin,
				],
			};
		}
		default:
			return state;
	}
};

const DisplayItem = memo(
	({
		cape,
		skin,
		state,
		onClick,
	}: { onClick: () => void; state: string; skin?: string; cape?: string }) => {
		const target = useRef<HTMLCanvasElement>(null);
		const viewer = useRef<SkinViewer>();

		useEffect(() => {
			if (target.current) {
				viewer.current = new SkinViewer({
					canvas: target.current,
					enableControls: false,
					cape,
					width: 125,
					height: 125,
					skin,
				});
			}
			return () => {
				viewer.current?.dispose();
			};
		}, [skin, cape]);

		return (
			<button type="button" onClick={onClick}>
				<canvas
					className={cn(
						"border rounded-lg transition-all hover:scale-105 aspect-square",
						{ "bg-accent bg-opacity-50": state === "ACTIVE" },
					)}
					width={150}
					height={150}
					ref={target}
				/>
			</button>
		);
	},
);

const MinecraftSkinControl: React.FC = memo(() => {
	const msAccount = useAccount();
	const target = useRef<HTMLCanvasElement>(null);
	const viewer = useRef<SkinViewer>();
	const { account, isLoading } = useUser();
	const [content, dispatch] = useReducer(reducer, {
		isReady: false,
		skins: [],
		capes: [],
	});

	const mutation = useMutation({
		onSuccess(data) {
			queryClient.setQueryData(
				["account", msAccount?.homeAccountId],
				(old: MinecraftAccount) => ({
					...old,
					details: data,
				}),
			);
		},
		onError(error) {
			logger.error(error.message);
		},
		mutationFn: async () => {
			if (!account) throw new Error("No profile data");
			const ogCapes = account?.details.capes;
			let response: MinecraftAccount["details"] | null = null;
			if (ogCapes) {
				const nextCape = content.capes.find((e) => e.state === "ACTIVE");
				const prev = ogCapes.find((e) => e.state === "ACTIVE");
				if (prev?.id !== nextCape?.id) {
					// No cape was selected.
					if (!nextCape) {
						const request = await fetch(MINECRAFT_API_CAPE, {
							method: "DELETE",
							headers: {
								Authorization: `Bearer ${account.token.access_token}`,
							},
						});
						if (!request.ok)
							throw new Error(request.statusText, { cause: request });
						const data = (await request.json()) as
							| { errorMessage: string }
							| MinecraftAccount["details"];
						if ("errorMessage" in data) throw new Error(data.errorMessage);

						response = data;
					} else {
						const request = await fetch(MINECRAFT_API_CAPE, {
							method: "PUT",
							headers: {
								Authorization: `Bearer ${account.token.access_token}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								capeId: nextCape.id,
							}),
						});
						if (!request.ok)
							throw new Error(request.statusText, { cause: request });
						const data = (await request.json()) as
							| MinecraftAccount["details"]
							| { errorMessage: string };
						if ("errorMessage" in data) throw new Error(data.errorMessage);

						response = data;
					}
				}
			}

			const ogSkin = account.details.skins.find((e) => e.state === "ACTIVE");
			const nextSkin = content.skins.find((e) => e.state === "ACTIVE");

			if (
				ogSkin?.id !== nextSkin?.id ||
				ogSkin?.variant !== nextSkin?.variant
			) {
				if (!nextSkin) throw new Error("Failed to update player skin");

				let contentType: string;
				let body: FormData | string;
				if (isUpload(nextSkin.url)) {
					contentType = "multipart/form-data";

					const formData = new FormData();
					formData.set("variant", nextSkin.variant);
					const filePath = decodeURIComponent(nextSkin.url)
						.replace("https://asset.localhost/", "")
						.replace("asset://", "");

					const filename = filePath.split(sep()).at(-1) ?? "player.png";

					const fileContent = await readFile(filePath);
					formData.set(
						"file",
						new File([fileContent], filename, { type: "image/png" }),
					);

					body = formData;
				} else {
					contentType = "application/json";
					body = JSON.stringify({
						url: nextSkin.url,
						variant: nextSkin.variant,
					});
				}

				const request = await fetch(MINECRAFT_API_SKIN, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${account.token.access_token}`,
						"Content-Type": contentType,
					},
					body,
				});

				if (!request.ok)
					throw new Error(request.statusText, { cause: request });
				const data = (await request.json()) as
					| MinecraftAccount["details"]
					| { errorMessage: string };
				if ("errorMessage" in data)
					throw new Error(data.errorMessage, { cause: request });

				response = data;
			}

			return response;
		},
	});

	useEffect(() => {
		if (target.current && !isLoading && account) {
			const skins = [
				...structuredClone(account.details.skins),
				...(DEFAULT_NAMES.map((e) => ({
					id: e,
					state: "INACTIVE",
					url: `https://visage.surgeplay.com/processedskin/${e}.png`,
					variant: e !== "X-Steve" ? "SLIM" : "CLASSIC",
				})) as Skin[]),
			];
			const capes = account.details.capes?.length
				? structuredClone(account.details.capes)
				: [];

			const activeSkin = skins.find((e) => e.state === "ACTIVE");
			const activeCape = capes.find((e) => e.state === "ACTIVE");

			viewer.current = new SkinViewer({
				canvas: target.current,
				animation: new IdleAnimation(),
				width: 300,
				height: 400,
				model:
					activeSkin?.variant === "CLASSIC"
						? "default"
						: ("slim" ?? "auto-detect"),
				skin: activeSkin?.url,
				cape: activeCape?.url,
			});

			dispatch({
				type: "INIT",
				capes,
				skins,
			});
		}

		return () => {
			viewer.current?.dispose();
		};
	}, [isLoading, account]);

	return (
		<>
			<div className={cn("hidden h-full", { block: !content.isReady })}>
				<Loading />
			</div>
			<div
				className={cn("flex h-full bg-accent/25", { hidden: !content.isReady })}
			>
				<div className="flex flex-col justify-center items-center w-full relative">
					<canvas className="w-full h-full" ref={target} />
					<div className="flex items-center space-x-2 absolute top-0 left-2">
						<Switch
							checked={
								content.skins.find((e) => e.state === "ACTIVE")?.variant ===
								"SLIM"
							}
							onCheckedChange={(value) => {
								const current = content.skins.find((e) => e.state === "ACTIVE");
								if (current) {
									dispatch({ type: "SET_SLIM", value, id: current.id });
									viewer.current?.loadSkin(current.url, {
										model: value ? "slim" : "default",
									});
								}
							}}
							id="slim-arms"
						/>
						<Label htmlFor="slim-arms">Slim Arms</Label>
					</div>
					<div>
						<Button
							disabled={mutation.isPending}
							onClick={() =>
								toast.promise(mutation.mutateAsync(), {
									pending: "Updating",
									error: "Failed to update",
									success: "Updated",
								})
							}
							size="sm"
						>
							Save
						</Button>
					</div>
				</div>
				<aside className="w-56 border-l overflow-y-scroll space-y-4">
					<div className="space-y-4">
						<h1 className="px-2 font-bold">Skins</h1>
						<Separator />
						<div className="flex flex-col items-center space-y-4">
							{content.skins.map((e) => (
								<DisplayItem
									onClick={() => {
										dispatch({ type: "SET_SKIN", id: e.id, state: "ACTIVE" });
										viewer.current?.loadSkin(e.url, {
											model: e.variant === "CLASSIC" ? "default" : "slim",
										});
									}}
									skin={e.url}
									state={e.state}
									key={e.id}
								/>
							))}
							<button
								onClick={async () => {
									const download = await downloadDir();
									const file = await open({
										multiple: false,
										defaultPath: download,
										directory: false,
										title: "Select player skin",
										filters: [
											{
												extensions: ["png"],
												name: "png",
											},
										],
									});
									if (!file || Array.isArray(file)) return;
									const cf = convertFileSrc(file);
									dispatch({ type: "ADD_SKIN", url: cf });
									viewer.current?.loadSkin(cf, { model: "default" });
								}}
								type="button"
								className="w-[125px] h-[125px] border flex items-center justify-center"
							>
								<Plus />
							</button>
						</div>
					</div>
					<div className="space-y-4">
						<h1 className="px-2 font-bold">Capes</h1>
						<Separator />
						<div className="flex flex-col items-center space-y-4">
							{content.capes.map((e) => (
								<DisplayItem
									onClick={() => {
										dispatch({ type: "SET_CAPE", id: e.id, state: "ACTIVE" });
										viewer.current?.loadCape(e.url);
									}}
									cape={e.url}
									state={e.state}
									key={e.id}
								/>
							))}
							<button
								onClick={() => {
									viewer.current?.loadCape(null);
									dispatch({ type: "SET_CAPE", id: "", state: "INACTIVE" });
								}}
								className={cn("w-[125px] h-[125px] border", {
									"bg-accent bg-opacity-50": content.capes.every(
										(e) => e.state === "INACTIVE",
									),
								})}
								type="button"
							>
								No Cape
							</button>
						</div>
					</div>
				</aside>
			</div>
		</>
	);
});

MinecraftSkinControl.displayName = "MinecraftSkinControl";

export const Route = createLazyFileRoute("/_authenticated/_layout/skins")({
	component: MinecraftSkinControl,
	errorComponent: (error) => <ErrorComponent error={error} />,
	pendingComponent: Loading,
});
