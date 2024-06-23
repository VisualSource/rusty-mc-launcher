import type { QueryClient } from "@tanstack/react-query";
import type { IPublicClientApplication } from "@masl/app/IPublicClientApplication";

export interface AppContext {
	queryClient: QueryClient
	auth: {
		msa: IPublicClientApplication;
		modrinth: undefined;
	};
}
