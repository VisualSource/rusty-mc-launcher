import { useCallback, useContext, useSyncExternalStore } from "react";
import { modrinthContext } from "@lib/context/ModrinthContext";
import { useQuery } from "@tanstack/react-query";

export const useModrinth = () => {
	const ctx = useContext(modrinthContext);
	if (!ctx)
		throw new Error("useModrinth needs to be inside of a ModrinthProvider");
	return ctx;
};

export const useModrinthFollows = () => {
	const ctx = useModrinth();
	const isAuthed = useIsModrinthAuthed();
	return useQuery({
		enabled: isAuthed,
		queryKey: ["MODRINTH", "FOLLOWS"],
		queryFn: async () => ctx.getFollowed(),
	});
};

export const useIsModrinthAuthed = () => {
	const ctx = useModrinth();
	const event = useCallback(
		(callback: () => void) => {
			ctx.addEventListener("update-data", callback);
			return () => {
				ctx.removeEventListener("update-data", callback);
			};
		},
		[ctx],
	);
	return useSyncExternalStore(event, () => ctx.isAuthed);
};

export const useModrinthAccount = () => {
	const ctx = useModrinth();
	const event = useCallback(
		(callback: () => void) => {
			ctx.addEventListener("update-data", callback);
			return () => {
				ctx.removeEventListener("update-data", callback);
			};
		},
		[ctx],
	);
	return useSyncExternalStore(event, () => ctx.getActiveAccount());
};
