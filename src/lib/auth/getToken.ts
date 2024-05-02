import type { IPublicClientApplication, SilentRequest } from "@masl/index";
import { PortGenerator } from "@system/commands";
import logger from "@system/logger";

const getToken = async (
  instance: IPublicClientApplication,
  request: SilentRequest,
) => {
  return instance
    .acquireTokenSilent(request)
    .catch(async () => {
      const port = PortGenerator.getInstance().setPort();
      logger.debug(`Login port: (${port})`);
      return instance.acquireTokenPopup({
        ...request,
        redirectUri: `http://localhost:${port}`,
      });
    })
    .then((e) => e.accessToken);
};

export default getToken;
