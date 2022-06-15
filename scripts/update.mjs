import { exit } from 'node:process';
import readline from 'node:readline';
import { promisify } from 'node:util';
import { exec } from 'child_process';
import { readFile } from 'fs/promises';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function ReadJsonFile(path) {
    let content = readFile(path, { encoding: "utf-8" });
    return JSON.stringify(content);
}

async function main() {
    let question = promisify(rl.question).bind(rl);

    let version = await question("Enter version id. Ext 0.1.0\n");

    if(!(/\d+.\d+.\d+/.test(version))) throw new Error("Invaild version format");

    let areyousure = await question(`Is version ${version} Ok. (y/N)\n`);

    if(areyousure.toLowerCase().trim() !== "y") throw new Error("Aborting update creation");







    rl.close();
}


main().catch((err)=>{ 
    console.error(err.message);
    exit(1);
});

