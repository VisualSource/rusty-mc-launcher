/// <reference types="vite/client" />
/// <reference types="@total-typescript/ts-reset"/>

interface ImportMetaEnv {
	readonly VITE_CLIENT_ID: string;
	readonly VITE_AUTHORITY: string;
	readonly VITE_MODRINTH_CLIENT_ID: string;
	readonly VITE_MODRINTH_SCOPES: string;
	readonly VITE_MODRINTH_CLIENT_SECRET: string;
	readonly VITE_GITHUB: string;
	readonly VITE_GITHUB_API_VERSION: string;
	readonly VITE_DEBUG: string;
	readonly VITE_REACT_DEVTOOLS: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
