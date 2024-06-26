import { Facets } from '@/lib/Facets';
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod';

const DEFUALT_FACETS = [
    ["categories:'forge'", "categories:'fabric'", "categories:'quilt'", "categories:'modloader'", "categories:'neoforge'"],
    ["project_type:mod"]
];
const querySchema = z.object({
    query: z.ostring(),
    index: z.enum(["relevance", "downloads", "follows", "newest", "updated"]).default("relevance").catch("relevance"),
    offset: z.number().default(0).catch(0),
    limit: z.number().min(0).max(100).positive().int().catch(24),
    facets: z.array(z.array(z.string())).transform((arg) => {
        return new Facets(arg)
    }).catch(new Facets(DEFUALT_FACETS))
});

export type ModrinthSearchParams = z.infer<typeof querySchema>;

export const Route = createFileRoute('/_authenticated/workshop/search')({
    validateSearch: (search) => querySchema.parse(search),
})