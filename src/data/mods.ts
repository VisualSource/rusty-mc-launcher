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
    type: "mod"
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
        type: "mod",
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
        type: "mod",
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
        type: "mod",
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
        type: "mod",
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
        type: "mod",
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
        type: "mod",
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
    },
    "ec110704-28ce-4be8-94f1-253bbb4ab2d9": {
        "id": "ec110704-28ce-4be8-94f1-253bbb4ab2d9",
        supports: ["Fabric", "Forge"],
        type: "mod",
        download: {
            type: "modrinth",
            id: "ferrite-core"
        },
        markdownProvider: {
            updateLinks: false,
            type: "github",
            owner: "malte0811",
            repo: "FerriteCore",
            imageRoot: ""
        },
        name: "Ferrite Core",
        description: "This mod reduces the memory usage of Minecraft in a few different ways.",
        img: { src: "https://camo.githubusercontent.com/27e24e1ad801ad4db88cd5c4d63c943629006504d710264678bf0aba000c1de0/68747470733a2f2f75706c6f61642e77696b696d656469612e6f72672f77696b6970656469612f636f6d6d6f6e732f642f64612f4b4c5f436f72654d656d6f72792e6a7067", alt: "Ferrite Core" },
        links: [{ href: "https://modrinth.com/mod/ferrite-core", type: "modrinth" }, { href: "https://github.com/malte0811/FerriteCore", type: "github" }]
    },
    "51fa3ce8-fe0c-415e-8c9d-818b92f1ebd0": {
        "id": "51fa3ce8-fe0c-415e-8c9d-818b92f1ebd0",
        supports: ["Fabric"],
        type: "mod",
        download: {
            type: "modrinth",
            id: "krypton"
        },
        markdownProvider: {
            updateLinks: false,
            type: "github",
            owner: "astei",
            repo: "krypton",
            imageRoot: ""
        },
        name: "Krypton",
        description: "Krypton (from Ancient Greek kryptos, 'the hidden one') is a Fabric mod that attempts to optimize the Minecraft networking stack. It derives from work done in the Velocity and Tuinity projects.",
        img: { src: "https://user-images.githubusercontent.com/16436212/102424564-692de280-3fd9-11eb-98a2-ac125cb8e507.png", alt: "Krypton" },
        links: [{ type: "discord", href: "https://discord.gg/RUGArxEQ8J" }, { href: "https://modrinth.com/mod/krypton/", type: "modrinth" }, { href: "https://github.com/astei/krypton", type: "github" }]
    },
    "3d8d24a6-7af2-4c90-9e8e-7cf5879095a3": {
        "id": "3d8d24a6-7af2-4c90-9e8e-7cf5879095a3",
        supports: ["Fabric"],
        type: "mod",
        download: {
            type: "modrinth",
            id: "indium"
        },
        markdownProvider: {
            updateLinks: false,
            type: "github",
            owner: "comp500",
            repo: "Indium",
            imageRoot: ""
        },
        name: "Indium",
        description: "Indium is an addon for the rendering optimisation mod Sodium, providing support for the Fabric Rendering API. The Fabric Rendering API is required for many mods that use advanced rendering effects, and is currently not supported by Sodium directly. Indium is based upon the reference implementation Indigo, which is part of Fabric API with source available here. (licensed Apache 2.0)",
        img: { src: "https://github.com/comp500/Indium/blob/1.20.x/main/src/main/resources/assets/indium/icon.png?raw=true", alt: "Indium" },
        links: [{ href: "https://modrinth.com/mod/indium/", type: "modrinth" }, { href: "https://github.com/comp500/Indium", type: "github" }]
    },
    "4a816163-1373-4f89-90b9-07f7b6b67018": {
        "id": "4a816163-1373-4f89-90b9-07f7b6b67018",
        supports: ["Fabric"],
        type: "mod",
        download: {
            type: "modrinth",
            id: "modmenu"
        },
        markdownProvider: {
            updateLinks: false,
            type: "github",
            owner: "TerraformersMC",
            repo: "ModMenu",
            imageRoot: ""
        },
        name: "Mod Menu",
        description: "Adds a mod menu to view the list of mods you have installed.",
        img: { src: "https://cdn.modrinth.com/data/mOgUt4GM/icon.png", alt: "ModMenu" },
        links: [{ type: "discord", href: "https://discord.gg/jEGF5fb" }, { href: "https://modrinth.com/mod/modmenu/", type: "modrinth" }, { href: "https://github.com/TerraformersMC/ModMenu", type: "github" }]
    }
}

export type ModList = {
    id: string;
    type: "modlist",
    name: string;
    description: string;
    mods: string[];
    icon: {
        src: string;
        alt: string;
    }
}

export const modsList: Record<string, ModList> = {
    "b19833c6-97b6-4621-bcb5-c293fa080e69": {
        id: "b19833c6-97b6-4621-bcb5-c293fa080e69",
        icon: {
            src: "/images/Vanilla.webp",
            alt: "default icon"
        },
        type: "modlist",
        name: "General Mod Pack",
        description: `A small set of mods for better minecraft.`,
        mods: [
            "f7d6d3ab-b7a2-4a2f-b050-fa86fca5620c",
            "514b7f1a-d599-4523-a955-dd391b5d410e",
            "190764c4-696e-412a-8fb7-16c2bfee96aa",
            "256a8134-3072-4bdd-849d-42ff652d390a"
        ]
    }
}