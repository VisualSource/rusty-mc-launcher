import type { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useSyncExternalStore } from "react";
const appWindow = getCurrentWebviewWindow()

class WindowState extends EventTarget {
	static INSTANCE: WindowState | null = null;
	static get(): WindowState {
		if (!WindowState.INSTANCE) {
			WindowState.INSTANCE = new WindowState();
		}
		return WindowState.INSTANCE;
	}

	private callbackCount = 0;
	private unlisten: Promise<UnlistenFn> | undefined;
	public isMaximized = false;

	constructor() {
		super();
		this.handler();
	}

	private init() {
		this.unlisten = appWindow.listen("tauri://resize", this.handler);
	}
	private distory() {
		this.unlisten
			?.then((sub) => sub())
			.then(() => {
				this.unlisten = undefined;
			});
	}

	private handler = async () => {
		this.isMaximized = await appWindow.isMaximized();
		this.dispatchEvent(new Event("change"));
	};

	public on = (callback: () => void) => {
		this.callbackCount++;
		if (this.callbackCount > 0 && !this.unlisten) {
			this.init();
		}
		this.addEventListener("change", callback);

		return () => {
			this.removeEventListener("change", callback);
			this.callbackCount--;
			if (this.callbackCount <= 0) {
				this.distory();
			}
		};
	};
}

export const useIsMaximized = () => {
	const isMaximized = useSyncExternalStore(
		WindowState.get().on,
		() => WindowState.get().isMaximized,
	);
	return isMaximized;
};
