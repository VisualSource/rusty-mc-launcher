import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { MsalProvider } from "@azure/msal-react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";

import { ModrinthClientApplication } from "@lib/api/modrinth/auth/ModrinthClientApplication";
import { ModrinthProvider } from "./components/providers/ModrinthProvider";
import { ProcessProvider } from "./lib/context/ProcessProvider";
import { DownloadProvider } from "@context/DownloadContext";
import { queryClient } from "@lib/api/queryClient";
import { getPCA } from "@auth/msal";
import { router } from "./router";
import "./index.css";
import "react-toastify/dist/ReactToastify.css";


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
						<DownloadProvider>
							<RouterProvider router={router} context={{}} />
						</DownloadProvider>
					</ModrinthProvider>
				</ProcessProvider>
			</MsalProvider>
		</QueryClientProvider>
	</StrictMode>
);