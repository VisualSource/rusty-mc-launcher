import { Grid2X2 } from "lucide-react";
import { Outlet } from "react-router-dom";
import ListGroup from "@/components/library/ListGroup";
import { Button } from "@/components/ui/button";

const Library: React.FC = () => {
    return (
        <div className="grid grid-cols-12 h-full">
            <section className="h-full col-span-3 border-r-4 border-zinc-900">
                <div className="bg-zinc-950 flex gap-1 p-2 shadow-lg">
                    <Button size="sm" variant="secondary" className="w-full rounded-sm justify-start">HOME</Button>
                    <Button size="sm" variant="ghost" className="rounded-sm text-zinc-700">
                        <Grid2X2 />
                    </Button>
                </div>
                <ul className="pt-2">
                    <ListGroup name="Favorites" count={0} />
                    <ListGroup name="Uncategorized" count={0} />
                </ul>
            </section>
            <section className="h-full col-span-9 bg-blue-900/10">
                <Outlet />
            </section>
        </div>
    );
}

export default Library;