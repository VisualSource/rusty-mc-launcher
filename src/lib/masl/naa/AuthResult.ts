/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { AccountInfo } from "./AccountInfo";
import type { TokenResponse } from "./TokenResponse";

export type AuthResult = {
	token: TokenResponse;
	account: AccountInfo;
};
