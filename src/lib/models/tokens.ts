import { z } from "zod";
import type { QueryResult } from "../api/plugins/query";
import { compareAsc } from "date-fns/compareAsc";

const transformDate = (arg: string | undefined, ctx: z.RefinementCtx) => {
    try {
        if (!arg) return undefined;
        return new Date(arg);
    } catch (error) {
        ctx.addIssue({
            code: "custom",
            fatal: true,
            message: (error as Error)?.message
        });
        return z.NEVER;
    }
}

export class Token {
    public id: string;
    public accessToken: string;
    public refreshToken: string;
    public accessTokenExp?: Date;
    public mcAccessToken?: string;
    public mcAccessTokenExp?: Date
    static schema = z.object({
        id: z.string(),
        accessToken: z.string(),
        accessTokenExp: z.string().date().transform(transformDate),
        refreshToken: z.string(),
        mcAccessToken: z.ostring(),
        mcAccessTokenExp: z.string().date().optional().transform(transformDate),
    });
    static fromQuery(args: QueryResult) {
        const data = Token.schema.parse(args);
        return new Token(data);
    }
    constructor(args: z.infer<typeof Token.schema>) {
        this.id = args.id;
        this.accessTokenExp = args.accessTokenExp;
        this.accessToken = args.accessToken;

        this.refreshToken = args.refreshToken;
        this.mcAccessToken = args.mcAccessToken;
        this.mcAccessTokenExp = args.mcAccessTokenExp;
    }

    public isAccessTokenExpired() {
        if (!this.accessTokenExp) return true;
        return compareAsc(new Date(), this.accessTokenExp) === -1;
    }

    public isMcAccessTokenExpired() {
        if (!this.mcAccessTokenExp) return true;
        return compareAsc(new Date(), this.mcAccessTokenExp) === -1;
    }

    public setMcData(at: string, exp: Date) {
        this.mcAccessToken = at;
        this.mcAccessTokenExp = exp;
    }

    public sterilize() {
        return {
            accessToken: this.accessToken,
            refreshToken: this.refreshToken,
            mcAccessToken: this.mcAccessToken ?? null,
            mcAccessTokenExp: this.mcAccessTokenExp ? this.mcAccessTokenExp.toISOString() : null
        };
    }
}