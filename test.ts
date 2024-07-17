import { spawn } from "node:child_process";

const exe = "";

const args: string[] = [

]

const p = spawn(exe, args)

p.stdout.setEncoding("utf-8");

p.stdout.on("data", (e) => {
    const str = e.toString();
    const lines = str.split(/(\r?\n)/g);
    console.log(lines.join(""));
});
p.stderr.on("data", (e) => {
    const str = e.toString();
    const lines = str.split(/(\r?\n)/g);
    console.log(lines.join(""));
});

p.on('close', (code) => {
    console.log(`process exit code ${code}`);
});