//import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { download_queue } from "../models/download_queue";
//import { db } from "@lib/system/commands";
import { z } from "zod";

console.log("Starting worker");

const schema = z.object({
    count: z.number()
});

console.log(self);


//window = new WebviewWindow()


const wait = (ms: number) => new Promise<void>(ok => setTimeout(ok, ms));

async function* process() {
    while (true) {
        await wait(3000);
        //const result = await db.select({ query: "SELECT COUNT(*) as count FROM download_queue WHERE state = 'CURRENT' LIMIT 1;", schema });
        const current = undefined;// result.at(0);
        if (current) continue;

        //const pending = await db.select({ query: "SELECT * FROM download_queue WHERE state = 'PENDING' ORDER BY install_order DESC LIMIT 1;", schema: download_queue.schema });
        //const next = pending.at(0);

        // if (!next) continue;

        //await db.execute({ query: "UPDATE download_queue SET state = 'CURRENT' WHERE id = ?", args: [next.id] });

        // yield next;
    }
}

//const event = await listen("rmcl://download", ev => postMessage({ type: ev.event, payload: ev.payload }));

for await (const item of process()) {
    try {
        console.log("PROCESSING ITEM", item);
    } catch (error) {
        console.error("System error", error);
    }
}

console.log("Existing Worker");

//await event();