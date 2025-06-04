import type { AccountInfo, AuthenticationResult, AuthorizationCodeRequest, BrowserConfiguration, ClearCacheRequest, EndSessionPopupRequest, EndSessionRequest, EventCallbackFunction, EventType, INavigationClient, InitializeApplicationRequest, IPublicClientApplication, ITokenCache, Logger, PerformanceCallbackFunction, PopupRequest, RedirectRequest, SilentRequest, SsoSilentRequest, WrapperSKU } from "@azure/msal-browser";
import type { AccountFilter } from "@azure/msal-common";

export class ModrinthClientApplication implements IPublicClientApplication {
    initialize(request?: InitializeApplicationRequest): Promise<void> {

    }
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    acquireTokenRedirect(request: RedirectRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    addEventCallback(callback: EventCallbackFunction, eventTypes?: Array<EventType>): string | null {
        throw new Error("Method not implemented.");
    }
    removeEventCallback(callbackId: string): void {
        throw new Error("Method not implemented.");
    }
    addPerformanceCallback(callback: PerformanceCallbackFunction): string {
        throw new Error("Method not implemented.");
    }
    removePerformanceCallback(callbackId: string): boolean {
        throw new Error("Method not implemented.");
    }
    enableAccountStorageEvents(): void {
        throw new Error("Method not implemented.");
    }
    disableAccountStorageEvents(): void {
        throw new Error("Method not implemented.");
    }
    getAccount(accountFilter: AccountFilter): AccountInfo | null {
        throw new Error("Method not implemented.");
    }
    getAccountByHomeId(homeAccountId: string): AccountInfo | null {
        throw new Error("Method not implemented.");
    }
    getAccountByLocalId(localId: string): AccountInfo | null {
        throw new Error("Method not implemented.");
    }
    getAccountByUsername(userName: string): AccountInfo | null {
        throw new Error("Method not implemented.");
    }
    getAllAccounts(): AccountInfo[] {
        throw new Error("Method not implemented.");
    }
    handleRedirectPromise(hash?: string): Promise<AuthenticationResult | null> {
        throw new Error("Method not implemented.");
    }
    loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    loginRedirect(request?: RedirectRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
    logout(logoutRequest?: EndSessionRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
    logoutRedirect(logoutRequest?: EndSessionRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
    logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
    ssoSilent(request: SsoSilentRequest): Promise<AuthenticationResult> {
        throw new Error("Method not implemented.");
    }
    getTokenCache(): ITokenCache {
        throw new Error("Method not implemented.");
    }
    getLogger(): Logger {
        throw new Error("Method not implemented.");
    }
    setLogger(logger: Logger): void {
        throw new Error("Method not implemented.");
    }
    setActiveAccount(account: AccountInfo | null): void {
        throw new Error("Method not implemented.");
    }
    getActiveAccount(): AccountInfo | null {
        return null;
    }
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
        throw new Error("Method not implemented.");
    }
    setNavigationClient(navigationClient: INavigationClient): void {
        throw new Error("Method not implemented.");
    }
    getConfiguration(): BrowserConfiguration {
        throw new Error("Method not implemented.");
    }
    hydrateCache(result: AuthenticationResult, request: SilentRequest | SsoSilentRequest | RedirectRequest | PopupRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
    clearCache(logoutRequest?: ClearCacheRequest): Promise<void> {
        throw new Error("Method not implemented.");
    }
}