import { exit } from 'node:process';
import readline from 'node:readline';
import { promisify } from 'node:util';
import { exec } from 'child_process';
import { readFile, writeFile } from 'fs/promises';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
async function WriteJsonFile(path, content) {
    return writeFile(path,JSON.stringify(content,undefined,2),{ encoding: "utf-8" });
}
async function ReadJsonFile(path) {
    let content = await readFile(path, { encoding: "utf-8" });
    return JSON.parse(content);
}
async function ReadTomlFile(path) {
    let content = await readFile(path, { encoding: "utf-8" });
    return content;
}
async function WriteTomlFile(path,content) {
    return writeFile(path,content,{ encoding: "utf-8" });
}

async function main() {
    try {
        const EXEC = promisify(exec);
        let question = promisify(rl.question).bind(rl);
        let version = await question("Enter version id. Ext 0.1.0\n");
        if(!(/\d+.\d+.\d+/.test(version))) throw new Error("Invaild version format");
        let areyousure = await question(`Is version ${version} Ok. (y/N)\n`);
        if(areyousure.toLowerCase().trim() !== "y") throw new Error("Aborting update creation");

        console.log("Reading Configs");
        const tauri_config = await ReadJsonFile("./src-tauri/tauri.conf.json");
        const npm_config = await ReadJsonFile("./package.json");

        tauri_config.package.version = version;
        npm_config.version = version;

        console.log("Writing Configs");
        await WriteJsonFile("./src-tauri/tauri.conf.json",tauri_config);
       
        const commnet_msg = await question(`Comment Message:\n`);
        console.log("Running Git Commands");
        const commit_out = await EXEC(`git commit -a -m "${commnet_msg}"`);
        console.log(commit_out.stdout.toString());
        const push_out = await EXEC("git push origin");
        console.log(push_out.stdout.toString());
        await EXEC(`git tag -a v${version} -m "Creating Updated"`).catch((err)=>console.warn(err.message)).then(o=>{ console.log(o.stdout.toString()); });
        const tag_origin = await EXEC(`git push origin v${version}`);
        console.log(tag_origin.stdout.toString());
        return 0;
    } catch (error) {
        console.log(error.message);
        return 1;
    }
}
main().then((code)=>{
    rl.close();
    exit(code);
}); 

