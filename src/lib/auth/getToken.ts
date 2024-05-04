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
      let port;
      try {
        port = await startAuthServer();
        logger.debug(`Login port: (${port})`);
        return instance.acquireTokenPopup({
          ...request,
          redirectUri: `http://localhost:${port}`,
        });
      } finally {
        closeAuthServer(port);
      }
    })
    .then((e) => e.accessToken);
};

export default getToken;
