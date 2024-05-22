import type { Loader } from "@/lib/system/commands"

export type MinecraftProfile = {
    id: string,
    name: string,

    date_created: string,

    version: string,
    loader: Loader,

    last_played: string | null,
    icon: string | null,
    loader_version: string | null,

    java_args: string | null,

    resolution_width: string | null,
    resolution_height: string | null,
}
