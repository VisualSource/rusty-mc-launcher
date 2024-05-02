import {
  type SilentRequest,
} from "@masl/index";

export const xboxRequest = {
  scopes: ["XboxLive.SignIn", "XboxLive.offline_access"],
  extraQueryParameters: {
    response_type: "code",
  },
} satisfies SilentRequest;
