/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { BridgeCapabilities } from "./BridgeCapabilities";
import type { AccountContext } from "./BridgeAccountContext";

export interface InitContext {
	capabilities?: BridgeCapabilities;
	sdkName: string;
	sdkVersion: string;
	accountContext?: AccountContext;
}
