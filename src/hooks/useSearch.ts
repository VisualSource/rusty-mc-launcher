import { useSyncExternalStore } from "react";
import searchManager from "@system/searchManager";

const callback = (cb: () => void) => {
	searchManager.addEventListener("update", cb);
	return () => {
		searchManager.removeEventListener("update", cb);
	};
};

export const useSearch = () => {
	return useSyncExternalStore(callback, () => searchManager.getSnapshot());
};
