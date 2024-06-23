

import type { ImperativePanelHandle } from "react-resizable-panels";
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { ErrorBoundary } from "react-error-boundary";
import { Suspense, useRef } from "react";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import Sidebar, { SidebarError } from "@/components/library/sidenav/Sidebar";

export const Route = createFileRoute('/_authenticated/_layout')({
  component: Layout,
});

function Layout() {
  const panel = useRef<ImperativePanelHandle>(null);

  return (
    <ResizablePanelGroup direction="horizontal" autoSave="true" autoSaveId="home-layout">
      <ResizablePanel order={0} collapsedSize={0} collapsible ref={panel} defaultSize={22} maxSize={22} className="@container/main">
        <div className="overflow-hidden animate-in fade-in-5">
          {panel.current?.isExpanded() ?? true ? (
            <ErrorBoundary fallbackRender={SidebarError}>
              <Suspense fallback={"Loading..."}>
                <Sidebar />
              </Suspense>
            </ErrorBoundary>
          ) : null}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel order={1}>
        <Outlet />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}