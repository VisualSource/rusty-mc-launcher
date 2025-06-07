import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { listen } from "@tauri-apps/api/event";
import { MsalProvider } from "@azure/msal-react";
import { createRoot } from "react-dom/client";
import Shake, { } from "@shakebugs/browser";
import { StrictMode } from "react";


import { ModrinthProvider } from "./components/providers/ModrinthProvider";
import { ProcessProvider } from "@component/providers/ProcessProvider";
import { checkForAppUpdate } from "./lib/system/updateCheck";
import { queryClient } from "@lib/api/queryClient";
import { logCatchError } from "./lib/catchError";
import { getPCA } from "@auth/msal";
import { router } from "./router";
import "./index.css";
import "react-lazy-load-image-component/src/effects/blur.css";
import { toastError } from "./lib/toast";
import { initThemes } from "./lib/api/themes";
import { getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { error, info } from "@tauri-apps/plugin-log";
import { ModrinthClientApplication } from "./lib/auth/modrinth";

initThemes();
if (import.meta.env.PROD) checkForAppUpdate().catch(logCatchError);

Promise.all([getTauriVersion(), getVersion()]).then(([tauri, app]) => {
	Shake.config.floatingButtonEnabled = false;
	Shake.report.screenshotIncluded = false;
	Shake.report.isSessionReplayEnabled = false;
	Shake.setMetadata("app_version", app);
	Shake.setMetadata("tauri", tauri);
	Shake.start(import.meta.env.VITE_SHAKE_APIKEY)
		.catch((err) => {
			error((err as Error)?.message);
		})
		.then(() => info("Shake is ready"));
});

listen<string>("rmcl-content-install-failed", (ev) => {
	const payload = ev.payload;
	toastError({
		title: "Install failed",
		description: "A item in the install queue failed",
		error: payload,
	});
}).catch((e) => console.error(e));

const msa = getPCA();
const mca = new ModrinthClientApplication();
mca.initialize().catch(e => console.error(e));

// biome-ignore lint/style/noNonNullAssertion: The dom element with id "root" shall be there.
const root = createRoot(document.getElementById("root")!);
root.render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<MsalProvider instance={msa}>
				<ProcessProvider>
					<ModrinthProvider client={mca}>
						<RouterProvider router={router} />
					</ModrinthProvider>
				</ProcessProvider>
			</MsalProvider>
		</QueryClientProvider>
	</StrictMode>,
);
