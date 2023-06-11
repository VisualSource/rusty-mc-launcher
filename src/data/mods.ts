export type IconTypes = "github" | "discord" | "modrinth" | "website" | "patreon" | "twitter"

type GithubProvider = {
    tagFormat: string;
    type: "github",
    repo: string;
    owner: string;
}

type ModrinthProvider = {
    type: "modrinth",
    id: string;
}

export type Mod = {
    id: string;
    supports: string[],
    download: GithubProvider | ModrinthProvider,
    markdownProvider: {
        updateLinks: boolean,
        type: "github",
        repo: string;
        owner: string;
        imageRoot: string;
    },
    name: string;
    description: string;
    img: { src: string, alt: string }
    links: { type: IconTypes, href: string; }[];
}

export const mods: { [mod: string]: Mod } = {
    "f7d6d3ab-b7a2-4a2f-b050-fa86fca5620c": {
        id: "f7d6d3ab-b7a2-4a2f-b050-fa86fca5620c",
        supports: ["Fabric"],
        markdownProvider: {
            updateLinks: true,
            type: "github",
            owner: "IrisShaders",
            repo: "Iris",
            imageRoot: "docs/"
        },
        download: {
            type: "modrinth",
            id: "iris"
        },
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
        download: {
            type: "modrinth",
            id: "phosphor"
        },
        markdownProvider: {
            updateLinks: true,
            type: "github",
            owner: "CaffeineMC",
            repo: "phosphor-fabric",
            imageRoot: "src/main/resources/"
        },
        name: "Phosphor",
        description: "Phosphor is a free and open-source Minecraft mod (under GNU GPLv3) aiming to save your CPU cycles and improve performance by optimizing one of Minecraft's most inefficient areas-- the lighting engine. It works on both the client and server, and can be installed on servers without requiring clients to also have the mod.",
        img: { src: "https://github.com/CaffeineMC/phosphor-fabric/raw/1.19.x/dev/src/main/resources/assets/phosphor/icon.png", alt: "phospor-fabric" },
        links: [{ href: "", type: "modrinth" }, { href: "https://caffeinemc.net/discord", type: "discord" }, { href: "https://github.com/CaffeineMC/phosphor-fabric", type: "github" }]
    },
    "514b7f1a-d599-4523-a955-dd391b5d410e": {
        id: "514b7f1a-d599-4523-a955-dd391b5d410e",
        supports: ["Fabric"],
        markdownProvider: {
            updateLinks: true,
            type: "github",
            owner: "CaffeineMC",
            repo: "lithium-fabric",
            imageRoot: "src/main/resources/"
        },
        download: {
            type: "modrinth",
            id: "lithium"
        },
        name: "Lithium",
        description: "Lithium is a free and open-source Minecraft mod which works to optimize many areas of the game in order to provide better overall performance. It works on both the client and server, and doesn't require the mod to be installed on both sides.",
        img: { src: "https://github.com/CaffeineMC/lithium-fabric/raw/develop/src/main/resources/assets/lithium/icon.png", alt: "lithium" },
        links: [{ href: "", type: "modrinth" }, { href: "https://caffeinemc.net/discord", type: "discord" }, { href: "https://github.com/CaffeineMC/lithium-fabric", type: "github" }]
    },
    "190764c4-696e-412a-8fb7-16c2bfee96aa": {
        id: "190764c4-696e-412a-8fb7-16c2bfee96aa",
        supports: ["Fabric"],
        markdownProvider: {
            updateLinks: true,
            type: "github",
            owner: "CaffeineMC",
            repo: "sodium-fabric",
            imageRoot: "src/main/resources/"
        },
        download: {
            type: "modrinth",
            id: "sodium"
        },
        name: "Sodium",
        description: "Sodium is a free and open-source optimization mod for the Minecraft client that improves frame rates, reduces micro-stutter, and fixes graphical issues in Minecraft.",
        img: { src: "https://github.com/CaffeineMC/sodium-fabric/raw/1.19.3/dev/src/main/resources/assets/sodium/icon.png", alt: "sodium" },
        links: [{ href: "", type: "modrinth" }, { href: "https://caffeinemc.net/discord", type: "discord" }, { href: "https://github.com/CaffeineMC/sodium-fabric", type: "github" }]
    },
    "256a8134-3072-4bdd-849d-42ff652d390a": {
        id: "256a8134-3072-4bdd-849d-42ff652d390a",
        supports: ["Fabric", "Forge"],
        download: {
            type: "modrinth",
            id: "entity-model-features"
        },
        markdownProvider: {
            updateLinks: false,
            type: "github",
            owner: "Traben-0",
            repo: "Entity_Model_Features",
            imageRoot: ""
        },
        name: "Entity Model Features",
        description: "Entity Model Features (EMF) is a Fabric, Quilt & Forge mod that adds support for OptiFine's Custom Entity Models (CEM). It's designed for anyone who wants to use the CEM resource pack features but to use mods such as Sodium, Continuity or ETF.",
        img: { src: "https://raw.githubusercontent.com/Traben-0/Entity_Model_Features/master/fabric/src/main/resources/icon.png", alt: "Entity Model Features" },
        links: [{ href: "https://modrinth.com/mod/entity-model-features", type: "modrinth" }, { href: "https://discord.com/invite/rURmwrzUcz", type: "discord" }, { href: "https://github.com/Traben-0/Entity_Model_Features", type: "github" }]
    },
    "1a7d6f7b-2f49-49ce-8b75-86658f55aa54": {
        id: "1a7d6f7b-2f49-49ce-8b75-86658f55aa54",
        supports: ["Fabric", "Forge"],
        download: {
            type: "modrinth",
            id: "entitytexturefeatures"
        },
        markdownProvider: {
            updateLinks: false,
            type: "github",
            owner: "Traben-0",
            repo: "Entity_Texture_Features",
            imageRoot: ""
        },
        name: "Entity Texture Features",
        description: "ETF is a Fabric (Quilt compatible) & Forge mod that adds many new Entity Texture Features, including entity and player skin features! This way, ETF achieves more OptiFine parity on the Fabric mod loader.",
        img: { src: "https://raw.githubusercontent.com/Traben-0/Entity_Texture_Features/master/.github/README-assets/icon.png", alt: "Entity Texture Features" },
        links: [{ href: "https://modrinth.com/mod/entitytexturefeatures", type: "modrinth" }, { href: "https://discord.com/invite/rURmwrzUcz", type: "discord" }, { href: "https://github.com/Traben-0/Entity_Texture_Features", type: "github" }]
    }
}