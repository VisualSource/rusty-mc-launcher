import { ErrorComponent, createLazyFileRoute } from "@tanstack/react-router";
import { memo, useEffect, useReducer, useRef } from "react";
import { downloadDir } from "@tauri-apps/api/path";
import { SkinViewer, IdleAnimation } from "skinview3d";
import { convertFileSrc } from "@tauri-apps/api/core";
import { useMutation } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { Plus } from "lucide-react";

import type { Skin } from "@/lib/api/minecraftAccount";
import { Separator } from "@/components/ui/separator";
import { waitToast } from "@component/ui/toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Label } from "@/components/ui/label";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";
import type { AuthenticationResultExtended } from "@/lib/auth/msal";
import { query } from "@/lib/api/plugins/query";
import { setCape, uploadSkin } from "@/lib/api/minecraft/skinUpload";

type Content = {
	isReady: boolean;
	activeSkinId?: string;
	activeCapeId?: string;
	variant: Skin["variant"]
};

type Action =
	| { type: "SET_VARIANT"; value: Skin["variant"] }
	| { type: "SET_SKIN"; id: string; }
	| { type: "SET_CAPE"; id?: string; }
	| { type: "ADD_SKIN"; url: string }
	| { type: "INIT"; activeSkinId?: string; activeCapeId?: string, variant: Skin["variant"] };

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

const reducer = (state: Content, payload: Action) => {
	switch (payload.type) {
		case "INIT":
			return {
				isReady: true,
				activeCapeId: payload.activeCapeId,
				activeSkinId: payload.activeSkinId,
				variant: payload.variant
			} as Content;
		case "SET_VARIANT":
			return {
				...state,
				variant: payload.value
			} as Content
		case "SET_CAPE": {
			return {
				...state,
				activeCapeId: payload.id
			} as Content;
		}
		case "SET_SKIN": {
			return {
				...state,
				activeSkinId: payload.id
			} as Content;
		}
		case "ADD_SKIN": {
			return {
				...state,
				activeSkinId: payload.url,
			}
		}
		default:
			return state;
	}
};

const DisplayItem = memo(
	({
		cape,
		skin,
		active,
		onClick,
	}: { onClick: () => void; active: boolean, skin?: string; cape?: string }) => {
		const target = useRef<HTMLCanvasElement>(null);
		const viewer = useRef<SkinViewer | undefined>(undefined);

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
						{ "bg-accent/75 border-accent-foreground": active },
					)}
					width={150}
					height={150}
					ref={target}
				/>
			</button>
		);
	},
);
DisplayItem.displayName = "SkinViewer";

const MinecraftSkinControl: React.FC = memo(() => {
	const target = useRef<HTMLCanvasElement>(null);
	const viewer = useRef<SkinViewer | undefined>(undefined);
	const { account, isLoading, acquireToken } = useUser();
	const [content, dispatch] = useReducer(reducer, {
		isReady: false,
		variant: "SLIM"
	});

	const mutation = useMutation({
		async onSuccess(data) {
			if (!data) return;
			await query`UPDATE accounts SET capes = ${JSON.stringify(data.capes)}, skins = ${JSON.stringify(data.skins)} WHERE homeAccountId = ${account?.homeAccountId}`.run();
			account?.setCapes(data.capes);
			account?.setSkins(data.skins);
			console.log("Update content", data);
		},
		onError(error) {
			console.error(error);
		},
		mutationFn: async (action: { skinId?: string, capeId?: string, variant: Skin["variant"] }) => {
			if (!account) throw new Error("No profile data");
			if (!action.skinId) throw new Error("Missing skinId");

			const token = await acquireToken() as AuthenticationResultExtended;
			const accessToken = token.tokens.mcAccessToken;
			if (!accessToken) throw new Error("Failed to get minecraft access tokens");

			const currentSkin = account.getActiveSkin();
			const currentCape = account.getActiveCape();

			let response = null;
			// We are trying to set skin from https://visage.surgeplay.com/processedskin
			if (action.skinId[0] === "X") {
				response = await uploadSkin({
					url: `https://visage.surgeplay.com/processedskin/${action.skinId}.png`,
					variant: action.variant
				}, accessToken);
				// this is a upload
			} else if (action.skinId.startsWith("http") || action.skinId.startsWith("asset://")) {
				response = await uploadSkin({
					url: action.skinId,
					variant: action.variant
				}, accessToken);
				// set skin to a existing skin / variant has changed
			} else if (action.skinId !== currentSkin?.id || action.variant !== currentSkin.variant) {
				const skin = account.skins.find(e => e.id === action.skinId);
				if (!skin) throw new Error("Failed to find skin to set", { cause: action.skinId });
				response = await uploadSkin({
					url: action.skinId,
					variant: action.variant
				}, accessToken);
			}

			if (action.capeId !== currentCape?.id) {
				response = await setCape(accessToken, action.capeId);
			}

			return response;
		},
	});

	useEffect(() => {
		if (target.current && !isLoading && account) {
			const activeSkin = account.getActiveSkin();
			const activeCape = account.getActiveCape();

			viewer.current = new SkinViewer({
				canvas: target.current,
				animation: new IdleAnimation(),
				width: 300,
				height: 400,
				model: activeSkin?.variant === "CLASSIC" ? "default" : "slim",
				skin: activeSkin?.url,
				cape: activeCape?.url,
			});

			dispatch({
				type: "INIT",
				variant: activeSkin?.variant ?? "SLIM",
				activeSkinId: activeSkin?.id,
				activeCapeId: activeCape?.id
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
								content.variant === "SLIM"
							}
							onCheckedChange={(value) => {
								dispatch({ type: "SET_VARIANT", value: value ? "SLIM" : "CLASSIC" });
								const data = account?.skins.find(e => e.id === content.activeSkinId);
								if (data) viewer.current?.loadSkin(data.url, {
									model: value ? "slim" : "default",
								});
							}}
							id="slim-arms"
						/>
						<Label htmlFor="slim-arms">Slim Arms</Label>
					</div>
					<div>
						<Button
							disabled={mutation.isPending}
							onClick={() =>
								waitToast({
									callback: mutation.mutateAsync({
										capeId: content.activeCapeId,
										skinId: content.activeSkinId,
										variant: content.variant
									}),
									pendingTitle: "Updating",
									errorTitle: "Failed to update",
									successTitle: "Updated",
								})
							}
							size="sm"
						>
							Save
						</Button>
					</div>
				</div>
				<aside className="w-56 border-l overflow-y-scroll space-y-4 pb-2">
					<div className="space-y-4">
						<h1 className="font-bold mb-0 px-2 py-1.5 bg-zinc-900">Skins</h1>
						<Separator />
						<div className="flex flex-col items-center space-y-4">
							{account?.skins.map((e) => (
								<DisplayItem
									onClick={() => {
										dispatch({ type: "SET_SKIN", id: e.id });
										viewer.current?.loadSkin(e.url, {
											model: content.variant === "CLASSIC" ? "default" : "slim",
										});
									}}
									skin={e.url}
									active={content.activeSkinId === e.id}
									key={e.id}
								/>
							))}
							{DEFAULT_NAMES.map(e => (
								<DisplayItem
									onClick={() => {
										dispatch({ type: "SET_SKIN", id: e });
										viewer.current?.loadSkin(`https://visage.surgeplay.com/processedskin/${e}.png`, {
											model: content.variant === "CLASSIC" ? "default" : "slim",
										});
									}}
									active={false}
									skin={`https://visage.surgeplay.com/processedskin/${e}.png`}
									key={`skin-${e}`}
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
									if (!file) return;
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
						<h1 className="px-2 font-bold mb-0 py-1.5 bg-zinc-900">Capes</h1>
						<Separator />
						<div className="flex flex-col items-center space-y-4">
							{account?.capes.map((e) => (
								<DisplayItem
									onClick={() => {
										dispatch({ type: "SET_CAPE", id: e.id });
										viewer.current?.loadCape(e.url);
									}}
									cape={e.url}
									active={content.activeCapeId === e.id}
									key={e.id}
								/>
							))}
							<button
								onClick={() => {
									viewer.current?.loadCape(null);
									dispatch({ type: "SET_CAPE" });
								}}
								className={cn("w-[125px] h-[125px] border rounded-lg transition-all hover:scale-105 aspect-square", {
									"bg-accent/75 border-accent-foreground": !content.activeCapeId
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

export const Route = createLazyFileRoute("/_authenticated/skins")({
	component: MinecraftSkinControl,
	errorComponent: (error) => <ErrorComponent error={error} />,
	pendingComponent: Loading,
});