import { compareAsc } from "date-fns/compareAsc";
import { addSeconds } from "date-fns/addSeconds";
import { UsersService } from "../services.gen";
import { Middleware, OpenAPI } from "../core/OpenAPI";
import type {
  AuthenticationResult,
  ClearCacheRequest,
  EndSessionPopupRequest,
  ITokenCache,
  PopupRequest,
  RedirectRequest,
  SsoSilentRequest,
} from "@masl/index";
import { AuthResponse, PopupClient } from "./PopupClient";
import {
  BrowserAuthErrorCodes,
  createBrowserAuthError,
} from "@/lib/masl/error/BrowserAuthError";
import { auth } from "@/lib/system/logger";

type CachedToken = Omit<AuthResponse, "expires_in"> & { expires: string };
type AccountInfo = Awaited<ReturnType<typeof UsersService.getUser>>;
type SilentRequest = { account?: AccountInfo };

export class ModrinthClientApplication {
  initialize(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public async acquireTokenPopup(): Promise<string> {
    const client = this.createPopupClient();
    const token = await client.acquireToken();

    const addHeader = (request: RequestInit) => {
      request.headers = new Headers(request.headers);
      request.headers.append("Authorization", token.access_token);
      return request;
    };

    OpenAPI.interceptors.request.use(addHeader);
    const response = await UsersService.getUserFromAuth();
    OpenAPI.interceptors.request.eject(addHeader);

    localStorage.setItem(
      `modrinth.user.${response.id}`,
      JSON.stringify(response),
    );
    localStorage.setItem(
      `modrinth.auth.${response.id}`,
      JSON.stringify({
        access_token: token.access_token,
        token_type: token.token_type,
        expires: addSeconds(new Date(), token.expires_in).toISOString(),
      }),
    );

    return token.access_token;
  }
  public async acquireTokenSilent(
    silentRequest: SilentRequest,
  ): Promise<string> {
    let account = silentRequest?.account
      ? silentRequest.account
      : this.getActiveAccount();
    if (!account) {
      throw new Error("Failed to get user account");
    }

    const cache = localStorage.getItem(`modrinth.auth.${account.id}`);

    if (!cache)
      throw createBrowserAuthError(
        BrowserAuthErrorCodes.noTokenRequestCacheError,
      );

    const data = JSON.parse(cache) as CachedToken;

    if (compareAsc(new Date(), data.expires) === 1) {
      localStorage.removeItem(`modrinth.auth.${account.id}`);
      throw createBrowserAuthError(BrowserAuthErrorCodes.unableToLoadToken);
    }

    return data.access_token;
  }
  public getAccountById(localId: string): AccountInfo | null {
    try {
      const user = localStorage.getItem(`modrinth.user.${localId}`);
      return user ? (JSON.parse(user) as AccountInfo) : null;
    } catch (error) {
      auth.error(`Failed to get user by id: ${(error as Error)?.message}`);
      return null;
    }
  }
  public getAccountByUsername(userName: string): AccountInfo | null {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("modrinth.user.")) continue;

      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        const item = JSON.parse(value) as AccountInfo;
        if (item.username === userName) return item;
      } catch (error) {
        auth.error(
          `Failed to parse user account info: ${(error as Error)?.message}`,
        );
      }
    }
    return null;
  }
  public getAllAccounts(): AccountInfo[] {
    let data = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("modrinth.user.")) continue;
      try {
        const value = localStorage.getItem(key);
        if (!value) continue;
        const item = JSON.parse(value) as AccountInfo;
        data.push(item);
      } catch (error) {
        auth.error(
          `Failed to parse user account info: ${(error as Error)?.message}`,
        );
      }
    }
    return data;
  }
  public loginPopup(
    request?: PopupRequest | undefined,
  ): Promise<AuthenticationResult> {
    throw new Error("Method not implemented.");
  }
  public logoutPopup(
    logoutRequest?: EndSessionPopupRequest | undefined,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public getTokenCache(): ITokenCache {
    throw new Error("Method not implemented.");
  }
  public setActiveAccount(account: AccountInfo | null): void {
    if (!account) return;
    localStorage.setItem("modrinth.active", account?.id);
  }
  public getActiveAccount(): AccountInfo | null {
    const active = localStorage.getItem("modrinth.active");
    if (!active) return null;

    try {
      return JSON.parse(active) as AccountInfo;
    } catch (error) {
      auth.error(`Failed to load active user: ${(error as Error)?.message}`);
      localStorage.removeItem("modrinth.active");
      return null;
    }
  }
  public hydrateCache(
    result: AuthenticationResult,
    request: PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest,
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public clearCache(
    logoutRequest?: ClearCacheRequest | undefined,
  ): Promise<void> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("modrinth")) continue;
      localStorage.removeItem(key);
    }

    throw new Error("Method not implemented.");
  }
  private createPopupClient() {
    return new PopupClient();
  }
}
