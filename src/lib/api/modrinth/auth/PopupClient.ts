import { UnlistenFn, once } from "@tauri-apps/api/event";
import {
  type PopupWindowAttributes,
  BrowserAuthErrorCodes,
  BrowserUtils,
  AuthError,
} from "@masl/index";
import { createBrowserAuthError } from "@masl/error/BrowserAuthError";
import { PopupParams } from "@masl/interaction_client/PopupClient";
import { BrowserConstants } from "@masl/utils/BrowserConstants";
import { auth } from "@system/logger";

export type AuthResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
};

const MODRINTH_REDIRECT = "rmcl://modrinth_auth/";
const MODRINTH_GET_TOKEN = "https://api.modrinth.com/_internal/oauth/token";
const MODRITH_AUTHORIZE = "https://modrinth.com/auth/authorize";

export class PopupClient {
  currentWindow: Window | undefined;
  public acquireToken() {
    try {
      const popupName = this.generatePopupName();
      const popup = this.openSizedPopup("about:blank", popupName, {});
      return this.acquireTokenPopupAsync(popupName, popup);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private async acquireTokenPopupAsync(
    popupName: string,
    popup?: Window | null,
  ) {
    BrowserUtils.preconnect(MODRITH_AUTHORIZE);
    try {
      const request_params = new URLSearchParams({
        client_id: import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_ID,
        scope: import.meta.env.PUBLIC_VITE_MODRINTH_SCOPES,
        response_type: "code",
        redirect_uri: MODRINTH_REDIRECT,
      });

      const navigate_url = `${MODRITH_AUTHORIZE}?${request_params.toString()}`;

      const popupWindow = this.openPopup(navigate_url, {
        popupName,
        popup,
        popupWindowAttributes: {},
      });

      const responseString = await this.monitorPopupForHash(popupWindow);

      const params = new URLSearchParams(responseString);

      if (!params.get("code"))
        throw createBrowserAuthError(BrowserAuthErrorCodes.unableToLoadToken);

      params.set("grant_type", "authorization_code");
      params.set("client_id", import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_ID);
      params.set("redirect_uri", MODRINTH_REDIRECT);

      /**
       * For how to send and format the request
       * @see https://stackoverflow.com/questions/40998133/content-type-for-token-request-in-oauth2
       * @see https://auth0.com/docs/api/authentication#get-token45
       *
       *
       * For where "client_secret" is set
       * @see https://github.com/modrinth/labrinth/blob/master/src/auth/oauth/mod.rs#L202-L204
       */

      const response = await fetch(MODRINTH_GET_TOKEN, {
        method: "POST",
        headers: {
          Authorization: import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_SECRET,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.postRequestFailed);
      }

      return response.json() as Promise<AuthResponse>;
    } catch (error) {
      if (popup) {
        popup.close();
      }
      throw error;
    }
  }

  private monitorPopupForHash(popupWindow: Window) {
    let intervalId: NodeJS.Timeout | undefined;
    let unlisten: Promise<UnlistenFn> | undefined;

    const hasHandler = new Promise<string>((resolve) => {
      unlisten = once<string>(MODRINTH_REDIRECT, (ev) => {
        resolve(ev.payload);
      });
    });

    const closeHandler = new Promise<string>((_, reject) => {
      intervalId = setInterval(() => {
        // Window is closed
        if (popupWindow.closed) {
          auth.error("PopupHandler.monitorPopupForHash - window closed");
          clearInterval(intervalId);
          reject(createBrowserAuthError(BrowserAuthErrorCodes.userCancelled));
          return;
        }
      }, 30);
    });

    return Promise.race([closeHandler, hasHandler]).finally(() => {
      clearInterval(intervalId);
      this.cleanPopup(popupWindow);
      unlisten?.then((unsub) => unsub()).catch((e) => auth.error(e));
    });
  }
  private openSizedPopup(
    urlNaviate: string,
    popupName: string,
    popupWindowAttributes: PopupWindowAttributes,
  ): Window | null {
    /**
     * adding winLeft and winTop to account for dual monitor
     * using screenLeft and screenTop for IE8 and earlier
     */
    const winLeft = window.screenLeft ? window.screenLeft : window.screenX;
    const winTop = window.screenTop ? window.screenTop : window.screenY;
    /**
     * window.innerWidth displays browser window"s height and width excluding toolbars
     * using document.documentElement.clientWidth for IE8 and earlier
     */
    const winWidth =
      window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth;
    const winHeight =
      window.innerHeight ||
      document.documentElement.clientHeight ||
      document.body.clientHeight;

    let width = popupWindowAttributes.popupSize?.width;
    let height = popupWindowAttributes.popupSize?.height;
    let top = popupWindowAttributes.popupPosition?.top;
    let left = popupWindowAttributes.popupPosition?.left;
    if (!width || width < 0 || width > winWidth) {
      width = BrowserConstants.POPUP_WIDTH;
    }

    if (!height || height < 0 || height > winHeight) {
      height = BrowserConstants.POPUP_HEIGHT;
    }

    if (!top || top < 0 || top > winHeight) {
      top = Math.max(
        0,
        winHeight / 2 - BrowserConstants.POPUP_HEIGHT / 2 + winTop,
      );
    }

    if (!left || left < 0 || left > winWidth) {
      left = Math.max(
        0,
        winWidth / 2 - BrowserConstants.POPUP_WIDTH / 2 + winLeft,
      );
    }

    return window.open(
      urlNaviate,
      popupName,
      `width=${width}, height=${height}, top=${top}, left=${left}, scrollbars=yes`,
    );
  }
  private openPopup(urlNaviagge: string, popupParams: PopupParams) {
    try {
      let popupWindow;

      if (popupParams.popup) {
        popupWindow = popupParams.popup;
        popupWindow.location.assign(urlNaviagge);
      } else if (typeof popupParams.popup === "undefined") {
        popupWindow = this.openSizedPopup(
          urlNaviagge,
          popupParams.popupName,
          popupParams.popupWindowAttributes,
        );
      }
      if (!popupWindow) {
        throw createBrowserAuthError(BrowserAuthErrorCodes.emptyWindowError);
      }
      if (popupWindow) popupWindow.focus();

      this.currentWindow = popupWindow;
      window.addEventListener("beforeunload", this.unloadWindow);

      return popupWindow;
    } catch (error) {
      auth.error("Error opening popup " + (error as AuthError)?.message);
      throw createBrowserAuthError(BrowserAuthErrorCodes.popupWindowError);
    }
  }
  private unloadWindow = (e: Event) => {
    if (this.currentWindow) {
      this.currentWindow.close();
    }
    e.preventDefault();
  };
  private cleanPopup(popupWindow?: Window): void {
    if (popupWindow) popupWindow.close();

    window.removeEventListener("beforeunload", this.unloadWindow);
  }
  private generatePopupName() {
    return `modrinth.${import.meta.env.PUBLIC_VIE_MODRINTH_CLIENT_ID}.${import.meta.env.PUBLIC_VIE_MODRINTH_SCOPES}`;
  }
}
