import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import categories from "@/lib/models/categories";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import logger from "@/lib/system/logger";
import { useSubmit } from "react-router-dom";
import { dialog } from "@tauri-apps/api";

const ProfileCategories: React.FC<{ id: string }> = ({ id }) => {
    return (
        <div className="flex flex-wrap gap-1">
            <ErrorBoundary fallback={<Badge variant="destructive">Failed to load Collections</Badge>}>
                <Suspense fallback={<Skeleton className="h-4 w-5" />}>
                    <Inner id={id} />
                </Suspense>
            </ErrorBoundary>
        </div>
    );
}

const Inner: React.FC<{ id: string }> = ({ id }) => {
    const submit = useSubmit();
    const { data, error } = useSuspenseQuery({
        queryKey: ["PROFILE_CATEGORIES", id],
        queryFn: async () => {
            const data = await categories.execute<{ name: string; group_id: number }>("SELECT name, group_id FROM categories WHERE profile_id IS NULL AND group_id IN (SELECT group_id FROM categories WHERE profile_id = ?);", [id]);
            return data ?? [];
        },
    });

    if (error) {
        throw new Error("Failed to load profile categories");
    }

    return (
        <>
            {data.map(value => (
                <Badge title="Delete" className="cursor-pointer" onClick={() => {
                    if (value.group_id === 0) {
                        dialog.message("Can not remove from uncategorized", {
                            title: "Remove from collection"
                        })
                    } else {
                        dialog.confirm("Are you sure?", { title: "Remove from collection", type: "warning" }).then(ok => {
                            if (ok) {
                                submit({ id, collection: value.group_id }, { action: "/collection", method: "DELETE" })
                            }
                        })
                    }
                }} key={value.group_id}>{value.name}</Badge>
            ))}
        </>
    );
}

export default ProfileCategories;