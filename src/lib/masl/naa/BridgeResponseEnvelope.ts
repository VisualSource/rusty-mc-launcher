/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { BridgeError } from "./BridgeError";
import type { TokenResponse } from "./TokenResponse";
import type { AccountInfo } from "./AccountInfo";
import type { InitContext } from "./InitContext";

export type BridgeResponseEnvelope = {
	messageType: "NestedAppAuthResponse";
	requestId: string;
	success: boolean; // false if body is error
	token?: TokenResponse;
	error?: BridgeError;
	account?: AccountInfo;
	initContext?: InitContext;
};
