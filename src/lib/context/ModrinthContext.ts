import { createContext } from "react";
import type { ModrinthClientApplication } from "@lib/api/modrinth/auth/ModrinthClientApplication";

export const modrinthContext = createContext<ModrinthClientApplication | null>(
	null,
);
