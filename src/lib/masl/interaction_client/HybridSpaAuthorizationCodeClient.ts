/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
	AuthorizationCodeClient,
	type ClientConfiguration,
} from "@azure/msal-common";

export class HybridSpaAuthorizationCodeClient extends AuthorizationCodeClient {
	constructor(config: ClientConfiguration) {
		super(config);
		this.includeRedirectUri = false;
	}
}
