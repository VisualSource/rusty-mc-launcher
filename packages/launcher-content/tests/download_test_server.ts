/** 
 * Bun.js Test Server
 * 
*/

const encoder = new TextEncoder();
const data = encoder.encode("Im a test file");

Bun.serve({
    port: 3000,
    routes: {
        "/file": () => {
            console.log(`${new Date().toUTCString()} - /file`);
            return new Response(data);
        }
    }
});