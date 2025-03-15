import type { AccountInfo, IdTokenClaims } from "@azure/msal-browser";
import { z } from "zod";
import type { QueryResult, TagFunc } from "../api/plugins/query";

export type Skin = {
    id: string;
    state: "ACTIVE" | "INACTIVE";
    url: string;
    variant: "CLASSIC" | "SLIM";
};

export type Cape = {
    alias: string;
    id: string;
    state: "ACTIVE" | "INACTIVE";
    url: string;
};

type Claims = (IdTokenClaims & { [key: string]: unknown; }) | undefined;

export class Account implements AccountInfo {
    static schema = z.object({
        authorityType: z.ostring().default("MSA"),
        environment: z.ostring().default("borwser"),
        tenantId: z.ostring().default(""),
        xuid: z.string().optional().nullable(),
        idTokenClaims: z.string().transform((arg, ctx) => {
            try {
                return JSON.parse(arg) as Claims;
            } catch (error) {
                ctx.addIssue({
                    code: "custom",
                    fatal: true,
                    message:
                        (error as Error)?.message ?? "Unknown Error"
                });
                return z.NEVER;
            }
        }),
        name: z.ostring(),
        id: z.string().optional().nullable(),
        username: z.string(),
        homeAccountId: z.string(),
        localAccountId: z.ostring().default(""),
        idToken: z.ostring(),
        capes: z.ostring().transform((arg, ctx) => {
            try {
                if (!arg) return [];
                return JSON.parse(arg) as Cape[];
            } catch (error) {
                ctx.addIssue({
                    code: "custom",
                    fatal: true,
                    message: (error as Error)?.message
                });
                return z.NEVER;
            }
        }),
        skins: z.ostring().transform((arg, ctx) => {
            try {
                if (!arg) return [];
                return JSON.parse(arg) as Skin[];
            } catch (error) {
                ctx.addIssue({
                    code: "custom",
                    fatal: true,
                    message: (error as Error)?.message
                })
                return z.NEVER;
            }
        }),
        profileActions: z.ostring().transform((arg, ctx) => {
            try {
                if (!arg) return {};
                return JSON.parse(arg) as Record<string, unknown>
            } catch (error) {
                ctx.addIssue({
                    code: "custom",
                    fatal: true,
                    message: (error as Error)?.message
                });
                return z.NEVER;
            }
        })
    });

    static fromQuery(args: QueryResult) {
        const data = Account.schema.parse(args);
        return new Account(data);
    }

    authorityType?: string | undefined;
    environment: string;
    homeAccountId: string;
    localAccountId: string;
    username: string;
    idTokenClaims?: Claims;
    idToken?: string | undefined;
    tenantId: string;
    name?: string | undefined;
    xuid?: string | null;
    id?: string | null;
    skins: Skin[] = [];
    capes: Cape[] = [];
    profileActions: Record<string, unknown> = {}
    constructor(args: z.infer<typeof Account.schema>) {
        this.authorityType = args.authorityType;
        this.environment = args.environment;
        this.homeAccountId = args.homeAccountId;
        this.localAccountId = args.localAccountId;
        this.username = args.username;
        this.idTokenClaims = args.idTokenClaims;
        this.idToken = args.idToken;
        this.tenantId = args.tenantId;
        this.name = args.name;
        this.xuid = args.xuid;
        this.id = args.id;
        this.skins = args.skins;
        this.capes = args.capes;
        this.profileActions = args.profileActions;
    }

    public setMCData(data: {
        name: string;
        xuid: string,
        id: string;
        profileActions: Record<string, unknown>,
        capes: Cape[],
        skins: Skin[]
    }) {
        this.name = data.name;
        this.xuid = data.xuid;
        this.capes = data.capes;
        this.skins = data.skins;
        this.profileActions = data.profileActions;
        this.id = data.id;
    }

    public runAsQuery(tx: TagFunc) {
        tx`INSERT INTO accounts VALUES (
            ${this.homeAccountId},
            ${this.username},
            ${JSON.stringify(this.idTokenClaims)},
            ${this.name},
            ${this.xuid},
            ${this.id},
            ${JSON.stringify(this.skins)},
            ${JSON.stringify(this.capes)},
            ${JSON.stringify(this.profileActions)});`;
    }
}