import { lazy } from "react";

export const DEFAULT_LAYOUT = [
	{
		id: "CF",
		type: "collection-display",
		params: { id: "aa0470a6-89e9-4404-a71c-008ee2025e72" },
	},
	{ id: "MPN", type: "mojang-patch-notes", params: {} },
	{
		id: "MMR",
		type: "modrinth-workshop",
		params: { content: "modpack", sort: "follows" },
	},
];

export const OPTIONS: Record<
	string,
	{
		id: string;
		title: string;
		Content: React.LazyExoticComponent<
			(props: { params: Record<string, string> }) => React.ReactNode
		>;
		Opts?: React.LazyExoticComponent<
			({ card, updateCard }: OptsProps) => JSX.Element
		>;
	}
> = {
	"collection-display": {
		id: "collection-display",
		title: "Collection: Display",
		Opts: lazy(
			() => import("@component/library/dynamic/options/CollectionOptions"),
		),
		Content: lazy(
			() => import("@component/library/dynamic/display/CollectionDisplay"),
		),
	},
	"modrinth-workshop": {
		id: "modrinth-workshop",
		title: "Modrinth: Workshop",
		Opts: lazy(
			() => import("@component/library/dynamic/options/ModrinthOptions"),
		),
		Content: lazy(
			() =>
				import("@component/library/dynamic/display/ModrinthWorkshopDisplay"),
		),
	},
	"mojang-patch-notes": {
		id: "mojang-patch-notes",
		title: "Mojang: Patch Notes",
		Content: lazy(
			() =>
				import("@component/library/dynamic/display/MojangPatchNotesDisplay"),
		),
	},
} as const;

export const STORAGE_KEY = "home-layout" as const;

export const ItemTypes = {
	CARD: "card",
} as const;

export type Card = {
	id: string;
	type: keyof typeof OPTIONS;
	params: Record<string, string>;
};

export type OptsProps = {
	card: Card;
	updateCard: (id: string, key: Record<string, unknown>) => void;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};
