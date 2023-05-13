export type IconTypes = "github" | "discord" | "curseforge" | "website" | "patreon" | "twitter"
export type Mod = {
    id: string;
    supports: string[],
    provider: {
        type: "github",
        repo: string;
        owner: string;
        imageRoot: string;
    },
    tagFormat: string;
    name: string;
    description: string;
    img: { src: string, alt: string }
    links: { type: IconTypes, href: string; }[];
}

export const mods: { [mod: string]: Mod } = {
    "f7d6d3ab-b7a2-4a2f-b050-fa86fca5620c": {
        id: "f7d6d3ab-b7a2-4a2f-b050-fa86fca5620c",
        supports: ["Fabric"],
        provider: {
            type: "github",
            owner: "IrisShaders",
            repo: "Iris",
            imageRoot: "docs/"
        },
        tagFormat: "(?<modversion>\d+.\d+.\d+)+(?<mcversion>\d+.\d+.\d+)",
        name: "Iris Shaders",
        description: "The Iris Project is a collaborative open-source project created by a team of passionate developers seeking to make the Minecraft shaders experience the best that it can be. Iris is developed by the community, for the community.",
        img: { src: "https://irisshaders.net/images/logos/iristrans-p-800.webp", alt: "irisshaders" },
        links: [
            { type: "github", href: "https://github.com/IrisShaders/Iris" },
            { type: "discord", href: "https://discord.gg/jQJnav2jPu" },
            { type: "twitter", href: "https://twitter.com/IrisShaders" },
            { type: "patreon", href: "https://www.patreon.com/coderbot" },
            { type: "website", href: "https://irisshaders.net/" }
        ]
    },
    "b88e4617-1154-4105-8525-ea50c79490d6": {
        id: "b88e4617-1154-4105-8525-ea50c79490d6",
        supports: ["Fabric"],
        provider: {
            type: "github",
            owner: "CaffeineMC",
            repo: "phosphor-fabric",
            imageRoot: "src/main/resources/"
        },
        tagFormat: "mc(?<mcversion>\d+.\d+.(\d+|x))-(?<modvesion>\d+.\d+.\d+)",
        name: "Phosphor",
        description: "Phosphor is a free and open-source Minecraft mod (under GNU GPLv3) aiming to save your CPU cycles and improve performance by optimizing one of Minecraft's most inefficient areas-- the lighting engine. It works on both the client and server, and can be installed on servers without requiring clients to also have the mod.",
        img: { src: "https://github.com/CaffeineMC/phosphor-fabric/raw/1.19.x/dev/src/main/resources/assets/phosphor/icon.png", alt: "phospor-fabric" },
        links: [{ href: "", type: "curseforge" }, { href: "https://caffeinemc.net/discord", type: "discord" }, { href: "https://github.com/CaffeineMC/phosphor-fabric", type: "github" }]
    },
    "514b7f1a-d599-4523-a955-dd391b5d410e": {
        id: "514b7f1a-d599-4523-a955-dd391b5d410e",
        supports: ["Fabric"],
        provider: {
            type: "github",
            owner: "CaffeineMC",
            repo: "lithium-fabric",
            imageRoot: "src/main/resources/"
        },
        tagFormat: "mc(?<mcversion>\d+.\d+.(\d+|x))-(?<modvesion>\d+.\d+.\d+)",
        name: "Lithium",
        description: "Lithium is a free and open-source Minecraft mod which works to optimize many areas of the game in order to provide better overall performance. It works on both the client and server, and doesn't require the mod to be installed on both sides.",
        img: { src: "https://github.com/CaffeineMC/lithium-fabric/raw/develop/src/main/resources/assets/lithium/icon.png", alt: "lithium" },
        links: [{ href: "", type: "curseforge" }, { href: "https://caffeinemc.net/discord", type: "discord" }, { href: "https://github.com/CaffeineMC/lithium-fabric", type: "github" }]
    },
    "190764c4-696e-412a-8fb7-16c2bfee96aa": {
        id: "190764c4-696e-412a-8fb7-16c2bfee96aa",
        supports: ["Fabric"],
        provider: {
            type: "github",
            owner: "CaffeineMC",
            repo: "sodium-fabric",
            imageRoot: "src/main/resources/"
        },
        tagFormat: "mc(?<mcversion>\d+.\d+.(\d+|x))-(?<modvesion>\d+.\d+.\d+)",
        name: "Sodium",
        description: "Sodium is a free and open-source optimization mod for the Minecraft client that improves frame rates, reduces micro-stutter, and fixes graphical issues in Minecraft.",
        img: { src: "https://github.com/CaffeineMC/sodium-fabric/raw/1.19.3/dev/src/main/resources/assets/sodium/icon.png", alt: "sodium" },
        links: [{ href: "", type: "curseforge" }, { href: "https://caffeinemc.net/discord", type: "discord" }, { href: "https://github.com/CaffeineMC/sodium-fabric", type: "github" }]
    }
}