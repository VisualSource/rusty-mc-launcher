/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
  ICrypto,
  INetworkModule,
  Logger,
  AccountInfo,
  AccountEntity,
  UrlString,
  ServerTelemetryManager,
  ServerTelemetryRequest,
  createClientConfigurationError,
  ClientConfigurationErrorCodes,
  Authority,
  AuthorityOptions,
  AuthorityFactory,
  IPerformanceClient,
  PerformanceEvents,
  AzureCloudOptions,
  invokeAsync,
} from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { version } from "../packageMetadata";
import { BrowserConstants } from "../utils/BrowserConstants";
import * as BrowserUtils from "../utils/BrowserUtils";
import { INavigationClient } from "../navigation/INavigationClient";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ClearCacheRequest } from "../request/ClearCacheRequest";
import { createNewGuid } from "../crypto/BrowserCrypto";

export abstract class BaseInteractionClient {
  protected config: BrowserConfiguration;
  protected browserStorage: BrowserCacheManager;
  protected browserCrypto: ICrypto;
  protected networkClient: INetworkModule;
  protected logger: Logger;
  protected eventHandler: EventHandler;
  protected navigationClient: INavigationClient;
  protected nativeMessageHandler: NativeMessageHandler | undefined;
  protected correlationId: string;
  protected performanceClient: IPerformanceClient;

  constructor(
    config: BrowserConfiguration,
    storageImpl: BrowserCacheManager,
    browserCrypto: ICrypto,
    logger: Logger,
    eventHandler: EventHandler,
    navigationClient: INavigationClient,
    performanceClient: IPerformanceClient,
    nativeMessageHandler?: NativeMessageHandler,
    correlationId?: string,
  ) {
    this.config = config;
    this.browserStorage = storageImpl;
    this.browserCrypto = browserCrypto;
    this.networkClient = this.config.system.networkClient;
    this.eventHandler = eventHandler;
    this.navigationClient = navigationClient;
    this.nativeMessageHandler = nativeMessageHandler;
    this.correlationId = correlationId || createNewGuid();
    this.logger = logger.clone(
      BrowserConstants.MSAL_SKU,
      version,
      this.correlationId,
    );
    this.performanceClient = performanceClient;
  }

  abstract acquireToken(
    request: RedirectRequest | PopupRequest | SsoSilentRequest,
  ): Promise<AuthenticationResult | void>;

  abstract logout(
    request: EndSessionRequest | ClearCacheRequest | undefined,
  ): Promise<void>;

  protected async clearCacheOnLogout(
    account?: AccountInfo | null,
  ): Promise<void> {
    if (account) {
      if (
        AccountEntity.accountInfoIsEqual(
          account,
          this.browserStorage.getActiveAccount(),
          false,
        )
      ) {
        this.logger.verbose("Setting active account to null");
        this.browserStorage.setActiveAccount(null);
      }
      // Clear given account.
      try {
        await this.browserStorage.removeAccount(
          AccountEntity.generateAccountCacheKey(account),
        );
        this.logger.verbose(
          "Cleared cache items belonging to the account provided in the logout request.",
        );
      } catch (error) {
        this.logger.error(
          "Account provided in logout request was not found. Local cache unchanged.",
        );
      }
    } else {
      try {
        this.logger.verbose(
          "No account provided in logout request, clearing all cache items.",
          this.correlationId,
        );
        // Clear all accounts and tokens
        await this.browserStorage.clear();
        // Clear any stray keys from IndexedDB
        await this.browserCrypto.clearKeystore();
      } catch (e) {
        this.logger.error(
          "Attempted to clear all MSAL cache items and failed. Local cache unchanged.",
        );
      }
    }
  }

  /**
   *
   * Use to get the redirect uri configured in MSAL or null.
   * @param requestRedirectUri
   * @returns Redirect URL
   *
   */
  getRedirectUri(requestRedirectUri?: string): string {
    this.logger.verbose("getRedirectUri called");
    const redirectUri =
      requestRedirectUri ||
      this.config.auth.redirectUri ||
      BrowserUtils.getCurrentUri();
    return UrlString.getAbsoluteUrl(redirectUri, BrowserUtils.getCurrentUri());
  }

  /**
   *
   * @param apiId
   * @param correlationId
   * @param forceRefresh
   */
  protected initializeServerTelemetryManager(
    apiId: number,
    forceRefresh?: boolean,
  ): ServerTelemetryManager {
    this.logger.verbose("initializeServerTelemetryManager called");
    const telemetryPayload: ServerTelemetryRequest = {
      clientId: this.config.auth.clientId,
      correlationId: this.correlationId,
      apiId: apiId,
      forceRefresh: forceRefresh || false,
      wrapperSKU: this.browserStorage.getWrapperMetadata()[0],
      wrapperVer: this.browserStorage.getWrapperMetadata()[1],
    };

    return new ServerTelemetryManager(telemetryPayload, this.browserStorage);
  }

  /**
   * Used to get a discovered version of the default authority.
   * @param requestAuthority
   * @param requestAzureCloudOptions
   * @param account
   */
  protected async getDiscoveredAuthority(
    requestAuthority?: string,
    requestAzureCloudOptions?: AzureCloudOptions,
    account?: AccountInfo,
  ): Promise<Authority> {
    this.performanceClient.addQueueMeasurement(
      PerformanceEvents.StandardInteractionClientGetDiscoveredAuthority,
      this.correlationId,
    );
    const authorityOptions: AuthorityOptions = {
      protocolMode: this.config.auth.protocolMode,
      OIDCOptions: this.config.auth.OIDCOptions,
      knownAuthorities: this.config.auth.knownAuthorities,
      cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
      authorityMetadata: this.config.auth.authorityMetadata,
      skipAuthorityMetadataCache: this.config.auth.skipAuthorityMetadataCache,
    };

    // build authority string based on auth params, precedence - azureCloudInstance + tenant >> authority
    const userAuthority = requestAuthority
      ? requestAuthority
      : this.config.auth.authority;

    // fall back to the authority from config
    const builtAuthority = Authority.generateAuthority(
      userAuthority,
      requestAzureCloudOptions || this.config.auth.azureCloudOptions,
    );
    const discoveredAuthority = await invokeAsync(
      AuthorityFactory.createDiscoveredInstance,
      PerformanceEvents.AuthorityFactoryCreateDiscoveredInstance,
      this.logger,
      this.performanceClient,
      this.correlationId,
    )(
      builtAuthority,
      this.config.system.networkClient,
      this.browserStorage,
      authorityOptions,
      this.logger,
      this.correlationId,
      this.performanceClient,
    );

    if (account && !discoveredAuthority.isAlias(account.environment)) {
      throw createClientConfigurationError(
        ClientConfigurationErrorCodes.authorityMismatch,
      );
    }

    return discoveredAuthority;
  }
}
