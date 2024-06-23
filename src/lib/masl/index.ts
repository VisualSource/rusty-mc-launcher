/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-browser
 */

import * as BrowserUtils from "./utils/BrowserUtils";
export { BrowserUtils };

export {
	PublicClientApplication,
	createNestablePublicClientApplication,
	createStandardPublicClientApplication,
} from "./app/PublicClientApplication";
export { PublicClientNext } from "./app/PublicClientNext";
export type { IController } from "./controllers/IController";
export {
	type Configuration,
	type BrowserAuthOptions,
	type CacheOptions,
	type BrowserSystemOptions,
	type BrowserTelemetryOptions,
	type BrowserConfiguration,
	DEFAULT_IFRAME_TIMEOUT_MS,
} from "./config/Configuration";
export {
	InteractionType,
	InteractionStatus,
	BrowserCacheLocation,
	WrapperSKU,
	ApiId,
	CacheLookupPolicy,
} from "./utils/BrowserConstants";

// Browser Errors
export {
	BrowserAuthError,
	BrowserAuthErrorMessage,
	BrowserAuthErrorCodes,
} from "./error/BrowserAuthError";
export {
	BrowserConfigurationAuthError,
	BrowserConfigurationAuthErrorCodes,
	BrowserConfigurationAuthErrorMessage,
} from "./error/BrowserConfigurationAuthError";

// Interfaces
export {
	type IPublicClientApplication,
	stubbedPublicClientApplication,
} from "./app/IPublicClientApplication";
export type { INavigationClient } from "./navigation/INavigationClient";
export { NavigationClient } from "./navigation/NavigationClient";
export type { NavigationOptions } from "./navigation/NavigationOptions";
export type { PopupRequest } from "./request/PopupRequest";
export type { RedirectRequest } from "./request/RedirectRequest";
export type { SilentRequest } from "./request/SilentRequest";
export type { SsoSilentRequest } from "./request/SsoSilentRequest";
export type { EndSessionRequest } from "./request/EndSessionRequest";
export type { EndSessionPopupRequest } from "./request/EndSessionPopupRequest";
export type { AuthorizationUrlRequest } from "./request/AuthorizationUrlRequest";
export type { AuthorizationCodeRequest } from "./request/AuthorizationCodeRequest";
export type { AuthenticationResult } from "./response/AuthenticationResult";
export type { ClearCacheRequest } from "./request/ClearCacheRequest";

// Cache
export type { LoadTokenOptions } from "./cache/TokenCache";
export type { ITokenCache } from "./cache/ITokenCache";

// Storage
export { MemoryStorage } from "./cache/MemoryStorage";
export { BrowserStorage } from "./cache/BrowserStorage";

// Events
export {
	type EventMessage,
	type EventPayload,
	type EventError,
	type EventCallbackFunction,
	EventMessageUtils,
	type PopupEvent,
} from "./event/EventMessage";
export { EventType } from "./event/EventType";

export {
	SignedHttpRequest,
	type SignedHttpRequestOptions,
} from "./crypto/SignedHttpRequest";

export {
	type PopupWindowAttributes,
	type PopupSize,
	type PopupPosition,
} from "./request/PopupWindowAttributes";

// Telemetry
export { BrowserPerformanceClient } from "./telemetry/BrowserPerformanceClient";
export { BrowserPerformanceMeasurement } from "./telemetry/BrowserPerformanceMeasurement";

// Common Object Formats
export {
	AuthenticationScheme,
	// Account
	type AccountInfo,
	AccountEntity,
	type IdTokenClaims,
	// Error
	AuthError,
	AuthErrorCodes,
	AuthErrorMessage,
	ClientAuthError,
	ClientAuthErrorCodes,
	ClientAuthErrorMessage,
	ClientConfigurationError,
	ClientConfigurationErrorCodes,
	ClientConfigurationErrorMessage,
	InteractionRequiredAuthError,
	InteractionRequiredAuthErrorCodes,
	InteractionRequiredAuthErrorMessage,
	ServerError,
	// Network
	type INetworkModule,
	type NetworkResponse,
	type NetworkRequestOptions,
	// Logger Object
	type ILoggerCallback,
	Logger,
	LogLevel,
	// Protocol Mode
	ProtocolMode,
	ServerResponseType,
	PromptValue,
	// Server Response
	type ExternalTokenResponse,
	// Utils
	StringUtils,
	UrlString,
	JsonWebTokenTypes,
	// AzureCloudInstance enum
	AzureCloudInstance,
	type AzureCloudOptions,
	AuthenticationHeaderParser,
	OIDC_DEFAULT_SCOPES,
	type PerformanceCallbackFunction,
	type PerformanceEvent,
	PerformanceEvents,
	// Telemetry
	type InProgressPerformanceEvent,
	type TenantProfile,
	type IPerformanceClient,
	StubPerformanceClient,
} from "@azure/msal-common";

export { version } from "./packageMetadata";
