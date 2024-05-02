import { AlertTriangle, Grid2X2 } from "lucide-react";
import { ErrorBoundary } from "react-error-boundary";
import { Link, Outlet } from "react-router-dom";
import { Suspense } from "react";

import { ScrollArea } from "@component/ui/scroll-area";
import { TypographyH4 } from "@component/ui/typography";
import { Button } from "@/components/ui/button";
import { Spinner } from "@component/ui/spinner";
import Sidebar from "./sidenav/Sidebar";

const Library: React.FC = () => {
  return (
    <div className="grid h-full grid-cols-12 grid-rows-6">
      <section className="col-span-3 row-span-full border-r-4 border-zinc-900 xl:col-span-2">
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
        <ScrollArea>
          <ul className="pt-2 text-white">
            <ErrorBoundary
              fallback={
                <li className="flex w-full flex-col items-center justify-center p-4">
                  <AlertTriangle className="h-16 w-16" />
                  <TypographyH4>Failed to load profiles!</TypographyH4>
                </li>
              }
            >
              <Suspense
                fallback={
                  <li className="flex w-full justify-center p-4">
                    <Spinner />{" "}
                  </li>
                }
              >
                <Sidebar />
              </Suspense>
            </ErrorBoundary>
          </ul>
        </ScrollArea>
      </section>
      <section className="col-span-9 row-span-full flex h-full flex-col bg-blue-900/10 xl:col-span-10">
        <Outlet />
      </section>
    </div>
  );
};

export default Library;
