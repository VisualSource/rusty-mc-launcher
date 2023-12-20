import type {
  IPublicClientApplication,
  SilentRequest,
} from "@azure/msal-browser";
import { PortGenerator } from "@system/commands";
import logger from "@system/logger";

const getToken = async (
  instance: IPublicClientApplication,
  request: SilentRequest,
) => {
  return instance.acquireTokenSilent(request).catch(async () => {
    const port = PortGenerator.getInstance().setPort();
    logger.debug(`Login port: (${port})`);
    return instance.acquireTokenPopup({
      ...request,
      redirectUri: `http://localhost:${port}`,
    });
  });
};

export default getToken;
