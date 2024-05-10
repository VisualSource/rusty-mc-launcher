import type { IPublicClientApplication, SilentRequest } from "@masl/index";
import { startAuthServer, closeAuthServer } from "@system/commands";
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
