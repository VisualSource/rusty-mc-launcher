import { once, type UnlistenFn } from '@tauri-apps/api/event';
import { internals, BrowserAuthError, UrlString, StringUtils } from "@azure/msal-browser";
import { startAuthServer } from "../system/commands";

// override
internals.PopupClient.prototype.monitorPopupForHash = async function (this: internals.PopupClient, popupWindow: Window): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {

        const port = await startAuthServer();
        if (!port) {
            return reject(BrowserAuthError.createPopupWindowError("Failed to start callback server"));
        }

        /*
        * Polling for popups needs to be tick-based,
        * since a non-trivial amount of time can be spent on interaction (which should not count against the timeout).
        */
        const maxTicks = this.config.system.windowHashTimeout / this.config.system.pollIntervalMilliseconds;
        let ticks = 0;
        let intervalId: NodeJS.Timeout | undefined;
        let callback: UnlistenFn | undefined;

        const cleanup = () => {
            // close auth server
            fetch(`http://127.0.0.1:${port}/exit`).catch(e => { });
            clearInterval(intervalId);
            if (callback) callback();
        }

        callback = await once<string>("redirect_uri", (ev) => {
            const payload = JSON.parse(ev.payload) as { status: "ok" | "error", data: string };

            if (payload.status === "ok") {
                this.logger.verbose("PopupHandler.monitorPopupForHash - found hash in url");
                cleanup();

                const hash = payload.data;

                if (UrlString.hashContainsKnownProperties(hash)) {
                    this.logger.verbose("PopupHandler.monitorPopupForHash - hash contains known properties, returning.");
                    resolve(hash);
                } else {
                    this.logger.error("PopupHandler.monitorPopupForHash - found hash in url but it does not contain known properties. Check that your router is not changing the hash prematurely.");
                    this.logger.errorPii(`PopupHandler.monitorPopupForHash - hash found: ${hash}`);
                    reject(BrowserAuthError.createHashDoesNotContainKnownPropertiesError());
                }
                return;
            }
            cleanup();
            reject(BrowserAuthError.createEmptyNavigationUriError());
        });

        this.logger.verbose("PopupHandler.monitorPopupForHash - polling started");

        intervalId = setInterval(() => {
            // Window is closed
            if (popupWindow.closed) {
                this.logger.error("PopupHandler.monitorPopupForHash - window closed");
                this.cleanPopup();
                cleanup();
                reject(BrowserAuthError.createUserCancelledError());
                return;
            }

            let href: string = "";
            let hash: string = "";
            try {
                /*
                 * Will throw if cross origin,
                 * which should be caught and ignored
                 * since we need the interval to keep running while on STS UI.
                 */
                href = popupWindow.location.href;
                hash = popupWindow.location.hash;
            } catch (e) { }

            // Don't process blank pages or cross domain
            if (StringUtils.isEmpty(href) || href === "about:blank") {
                return;
            }

            /*
            * Only run clock when we are on same domain for popups
            * as popup operations can take a long time.
            */
            ticks++;
            if (ticks > maxTicks) {
                this.logger.error("PopupHandler.monitorPopupForHash - unable to find hash in url, timing out");
                cleanup();
                reject(BrowserAuthError.createMonitorPopupTimeoutError());
            }
        }, this.config.system.pollIntervalMilliseconds);
    }).finally(() => {
        this.cleanPopup(popupWindow);
    });
}

internals.PopupClient.prototype.waitForLogoutPopup = async function (this: internals.PopupClient, popupWindow: Window): Promise<void> {
    return new Promise<number>(async (resolve) => {
        let subscription: UnlistenFn | undefined;

        const port = await startAuthServer();
        if (!port) throw new Error("No port set.");

        const intervalId = setInterval(() => {
            if (popupWindow.closed) {
                this.logger.error("PopupHandler.waitForLogoutPopup - window closed");
                clearInterval(intervalId);
                if (subscription) subscription();
                resolve(port);
            }
        }, this.config.system.pollIntervalMilliseconds);
        subscription = await once("redirect_uri", (ev) => {
            this.logger.verbose("PopupHandler.waitForLogoutPopup - popup window is on same origin as caller, closing.");
            clearInterval(intervalId);
            resolve(port);
        });
    }).then((port) => {
        try { fetch(`http://127.0.0.1:${port}/exit`) } catch (e) { }
    }).finally(() => {
        this.cleanPopup(popupWindow);
    });
}