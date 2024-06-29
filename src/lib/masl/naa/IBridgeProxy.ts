/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { AuthResult } from "./AuthResult";
import type { AccountContext } from "./BridgeAccountContext";
import type { BridgeCapabilities } from "./BridgeCapabilities";
import type { TokenRequest } from "./TokenRequest";

export interface IBridgeProxy {
	getTokenInteractive(request: TokenRequest): Promise<AuthResult>;
	getTokenSilent(request: TokenRequest): Promise<AuthResult>;
	getHostCapabilities(): BridgeCapabilities | null;
	getAccountContext(): AccountContext | null;
}
