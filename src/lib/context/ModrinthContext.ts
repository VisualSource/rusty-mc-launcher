import { createContext } from "react";
import type { ModrinthClientApplication } from "../auth/modrinth";

export const modrinthContext = createContext<ModrinthClientApplication | null>(
	null,
);
