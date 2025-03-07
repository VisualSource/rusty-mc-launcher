import type {
	IPublicClientApplication,
	SilentRequest,
} from "@azure/msal-browser";

const getToken = async (
	instance: IPublicClientApplication,
	request: SilentRequest,
) => {
	return instance
		.acquireTokenSilent(request)
		.catch(() => instance.acquireTokenPopup(request))
		.then((e) => e.accessToken);
};

export default getToken;
