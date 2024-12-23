import type { ImperativePanelHandle } from "react-resizable-panels";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense, useRef } from "react";
import { Grid2X2 } from "lucide-react";

import {
	ResizablePanelGroup,
	ResizablePanel,
	ResizableHandle,
} from "@/components/ui/resizable";
import Sidebar, { SidebarError } from "@/components/library/sidenav/Sidebar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/_layout")({
	component: Layout,
});

function Layout() {
	const panel = useRef<ImperativePanelHandle>(null);

	return (
		<ResizablePanelGroup
			direction="horizontal"
			autoSave="true"
			autoSaveId="home-layout"
		>
			<ResizablePanel
				tagName="section"
				order={0}
				collapsedSize={0}
				collapsible
				ref={panel}
				defaultSize={22}
				maxSize={22}
				className="@container/main bg-accent/25"
			>
				<div className="overflow-hidden animate-in fade-in-5 ">
					{(panel.current?.isExpanded() ?? true) ? (
						<div>
							<div className="flex gap-1 bg-zinc-950 p-2 shadow-lg">
								<Button
									size="sm"
									variant="secondary"
									className="w-full justify-start rounded-sm"
									asChild
								>
									<Link to="/">HOME</Link>
								</Button>
								<Button
									size="sm"
									variant="ghost"
									className="rounded-sm text-zinc-700"
									asChild
								>
									<Link title="View collections" to="/collections">
										<Grid2X2 />
									</Link>
								</Button>
							</div>
							<ErrorBoundary FallbackComponent={SidebarError}>
								<Suspense fallback={"Loading..."}>
									<Sidebar />
								</Suspense>
							</ErrorBoundary>
						</div>
					) : null}
				</div>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel
				tagName="section"
				order={1}
				className="@container/home-main flex flex-col h-full"
			>
				<Outlet />
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}
