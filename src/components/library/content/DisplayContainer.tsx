import { useSuspenseQuery } from "@tanstack/react-query";
import { Settings2 } from "lucide-react";
import { Suspense } from "react";

import { type Card, OPTIONS, STORAGE_KEY } from "./edit/EditConsts";
import { Button } from "@/components/ui/button";

export const DisplayContainer: React.FC<{ setEditMode: React.Dispatch<React.SetStateAction<boolean>> }> = ({ setEditMode }) => {
    const { data } = useSuspenseQuery({
        queryKey: ["HOME_LAYOUT"],
        queryFn: () => {
            const data = localStorage.getItem(STORAGE_KEY);
            if (!data) return [];
            try {
                return JSON.parse(data) as Card[];
            } catch (error) {
                console.error(error);
                return [];
            }
        }
    });

    return (
        <>
            <Button onClick={() => setEditMode(e => !e)} title="Edit" size="sm" variant="ghost" className="absolute top-0 right-0 z-50">
                <Settings2 />
            </Button>

            {data.map(e => {
                const Content = OPTIONS[e.type].Content;
                return (<Suspense key={e.id}>
                    <Content params={e.params} />
                </Suspense>)
            })}
        </>
    );
}