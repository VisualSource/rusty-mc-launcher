import type { IPublicClientApplication } from "@masl/app/IPublicClientApplication";
import type { SilentRequest } from "@masl/request/SilentRequest";
import { startAuthServer, closeAuthServer } from "@lib/api/plugins/auth";
import logger from "@system/logger";

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
				logger.debug(`Login port: (${port})`);
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
