import { QueryClientProvider } from "@tanstack/react-query";
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
/**
 * Window 10 border bug
 * @see https://github.com/tauri-apps/tauri/issues/11654
 * @description have to disable shadow on window to fix
 */
if (import.meta.env.PROD) checkForAppUpdate().catch(logCatchError);

const msa = getPCA();
const mca = new ModrinthClientApplication();
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
