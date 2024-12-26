import { open } from "@tauri-apps/plugin-dialog";
import { error } from "@tauri-apps/plugin-log";
import type { Id } from "react-toastify";
import toast, { updateToast } from "@component/ui/toast";
import { queryClient } from "@/lib/api/queryClient";
import { importFile } from "../api/plugins/content";

export async function profileImportFile(profile: string, type: "Mod" | "Resourcepack" | "Shader") {
    let toastId: Id | undefined;
    try {
        const file = await open({
            title: "Import Content",
            filters: [
                {
                    name: "Mod",
                    extensions: ["jar"],
                },
                {
                    name: "Resource Pack | Shader Pack",
                    extensions: ["zip"],
                },
            ],
        });
        if (!file) return;

        toastId = toast({ title: "Importing File", closeButton: false, opts: { isLoading: true } });

        await importFile(profile, file, type);
        await queryClient.invalidateQueries({
            queryKey: ["WORKSHOP_CONTENT", type, profile],
        });

        updateToast(toastId, { isLoading: false, autoClose: 5000, data: { variant: "success", title: "Imported Content" } });
    } catch (err) {
        error((err as Error).message);
        if (toastId) updateToast(toastId, { isLoading: false, autoClose: 5000, data: { error: err, variant: "error", title: "Failed to import content" } });
    }
}