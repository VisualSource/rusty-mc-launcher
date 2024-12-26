import type {
	IPublicClientApplication,
	SilentRequest,
} from "@azure/msal-browser";
import { startAuthServer, closeAuthServer } from "@lib/api/plugins/auth";
import { debug } from "@tauri-apps/plugin-log";

const getToken = async (
	instance: IPublicClientApplication,
	request: SilentRequest,
) => {
	return instance
		.acquireTokenSilent(request)
		.catch(async () => {
			let port = null;
			try {
				port = await startAuthServer();
				debug(`Login port: (${port})`);
				const token = await instance.acquireTokenPopup({
					...request,
					redirectUri: `http://localhost:${port}`,
				});
				return token;
			} finally {
				if (port !== null) closeAuthServer(port);
			}
		})
		.then((e) => e.accessToken);
};

export default getToken;
