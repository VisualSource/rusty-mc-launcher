import type { QueryClient } from "@tanstack/react-query";
import type { IPublicClientApplication } from "@masl/app/IPublicClientApplication";
//import type { ModrinthClientApplication } from "./lib/api/modrinth/auth/ModrinthClientApplication";

export interface AppContext {
	queryClient: QueryClient;
	auth: {
		msa: IPublicClientApplication;
		//modrinth: ModrinthClientApplication;
	};
}
