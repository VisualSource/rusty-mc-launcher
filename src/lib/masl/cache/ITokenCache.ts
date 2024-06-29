/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { ExternalTokenResponse } from "@azure/msal-common";
import type { SilentRequest } from "../request/SilentRequest";
import type { LoadTokenOptions } from "./TokenCache";
import type { AuthenticationResult } from "../response/AuthenticationResult";

export interface ITokenCache {
	/**
	 * API to side-load tokens to MSAL cache
	 * @returns `AuthenticationResult` for the response that was loaded.
	 */
	loadExternalTokens(
		request: SilentRequest,
		response: ExternalTokenResponse,
		options: LoadTokenOptions,
	): AuthenticationResult;
}
