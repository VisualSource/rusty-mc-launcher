import { Outlet } from "react-router-dom";
import { Grid2X2 } from "lucide-react";
import { Suspense } from "react";
import { ErrorBoundary } from 'react-error-boundary';

import SidebarList from "@/components/library/SidebarList";
import { Button } from "@/components/ui/button";

const Library: React.FC = () => {

    return (
        <div className="grid grid-rows-6 grid-cols-12 h-full">
            <section className="col-span-3 xl:col-span-2 row-span-full border-r-4 border-zinc-900">
                <div className="bg-zinc-950 flex gap-1 p-2 shadow-lg">
                    <Button size="sm" variant="secondary" className="w-full rounded-sm justify-start">HOME</Button>
                    <Button size="sm" variant="ghost" className="rounded-sm text-zinc-700">
                        <Grid2X2 />
                    </Button>
                </div>
                <ul className="pt-2 text-white">
                    <ErrorBoundary fallback={<li>Error...</li>}>
                        <Suspense fallback={<li>Loading...</li>}>
                            <SidebarList />
                        </Suspense>
                    </ErrorBoundary>
                </ul>
            </section>
            <section className="flex flex-col row-span-full h-full col-span-9 xl:col-span-10 bg-blue-900/10">
                <Outlet />
            </section>
        </div>
    );
}

export default Library;