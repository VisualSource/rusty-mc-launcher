import { useContext } from "react";
import { modrinthContext } from "@lib/context/ModrinthContext";

export const useModrinth = () => {
	const ctx = useContext(modrinthContext);
	if (!ctx)
		throw new Error("useModrinth needs to be inside of a ModrinthProvider");
	return ctx;
};
