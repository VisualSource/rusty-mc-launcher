import type { IPublicClientApplication } from "@masl/app/IPublicClientApplication";

export interface AppContext {
	auth: {
		msa: IPublicClientApplication;
		modrinth: undefined;
	};
}
