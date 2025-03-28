import { QueryClientProvider } from "@tanstack/react-query";
import { listen } from "@tauri-apps/api/event";
import { RouterProvider } from "@tanstack/react-router";
import { MsalProvider } from "@azure/msal-react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import { ModrinthClientApplication } from "@lib/api/modrinth/auth/ModrinthClientApplication";
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

if (import.meta.env.PROD) checkForAppUpdate().catch(logCatchError);

const msa = getPCA();
const mca = new ModrinthClientApplication();
listen<string>("rmcl-content-install-failed", (ev) => {
	const payload = ev.payload;
	toastError({
		title: "Install failed",
		description: "A item in the install queue failed",
		error: payload,
	});
}).catch((e) => console.error(e));
initThemes();

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
