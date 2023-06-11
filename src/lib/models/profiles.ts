import { Schema, Type, type InferSchema } from "../db/sqlite";

const profiles = new Schema("profile", {
    id: Type.Text().primary_key(),
    console: Type.Boolean().default("FALSE"),
    is_demo: Type.Boolean().default("FALSE"),
    disable_mulitplayer: Type.Boolean().default("FALSE"),
    disable_chat: Type.Boolean().default("FALSE"),
    name: Type.Text(),
    created: Type.Date().default("CURRENT_TIMESTAMP"),
    lastUsed: Type.Date().default("CURRENT_TIMESTAMP").nullable(),
    icon: Type.Blob().nullable(),
    lastVersionId: Type.Text(),
    gameDir: Type.Text().nullable(),
    javaDir: Type.Text().nullable(),
    javaArgs: Type.Json<string[]>().nullable(),
    logConfig: Type.Text().nullable(),
    logConfigIsXML: Type.Boolean().default("TRUE"),
    resolution: Type.Json<{ width: number; height: number; }>().nullable(),
    active: Type.Boolean().default("FALSE"),
    mods: Type.Json<{ id: string; version: string; }[]>().nullable().default([]),
});

export type MinecraftProfile = InferSchema<typeof profiles>;

export default profiles;