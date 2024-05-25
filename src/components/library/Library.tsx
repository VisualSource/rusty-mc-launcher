import { ErrorBoundary } from "react-error-boundary";
import { Link, Outlet } from "react-router-dom";
import { Grid2X2 } from "lucide-react";
import { Suspense } from "react";

import Sidebar, { SidebarError } from "./sidenav/Sidebar";
import { ScrollArea } from "@component/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Spinner } from "@component/ui/spinner";

const Library: React.FC = () => {
  return (
    <div className="grid h-full w-full grid-cols-12 grid-rows-6 bg-zinc-900">
      <section className="col-span-3 row-span-full flex flex-col border-r-4 border-zinc-900 xl:col-span-2">
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
            <Link to="/collections">
              <Grid2X2 />
            </Link>
          </Button>
        </div>
        <ErrorBoundary fallbackRender={SidebarError}>
          <Suspense
            fallback={
              <div className="flex h-full flex-col items-center justify-center">
                <Spinner />
              </div>
            }
          >
            <ScrollArea>
              <Sidebar />
            </ScrollArea>
          </Suspense>
        </ErrorBoundary>
      </section>
      <section className="col-span-9 row-span-full flex h-full flex-col bg-blue-900/10 xl:col-span-10">
        <Outlet />
      </section>
    </div>
  );
};

export default Library;
