import { spawn } from "child_process";

const Colors = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m"
};

async function main() {
    const devtools = spawn("npx",["react-devtools"], { "shell": "powershell.exe" });

    devtools.on("close",(code)=>{
        if(code !== 0) {
            console.log(`${Colors.FgRed}%s${Colors.Reset}`,`React devtools has exited (${code})`);            
        } else {
            console.log(`${Colors.FgGreen}%s${Colors.Reset}`,`React devtools has exited (${code})`);
        }
    });

    const dev_server = spawn("npm",["run","db"], { "shell": "powershell.exe" });

    dev_server.stdout.on("data",(data)=>{
        console.log(data.toString());
    });

    dev_server.on("close",(code)=>{
        if(code !== 0) {
            console.log(`${Colors.FgRed}%s${Colors.Reset}`,`JsonDB has exited (${code})`);            
        } else {
            console.log(`${Colors.FgGreen}%s${Colors.Reset}`,`JsonDB has exited (${code})`);
        }
    });


    const app = spawn("npm",["run","tauri","dev"], { "shell": "powershell.exe" });

    app.on("close",(code)=>{
        if(code !== 0) {
            console.log(`${Colors.FgRed}%s${Colors.Reset}`,`App has exited (${code})`);            
        } else {
            console.log(`${Colors.FgGreen}%s${Colors.Reset}`,`App has exited (${code})`);
        }
    });

    app.stdout.on("data",(data)=>{
        console.log(data.toString());
    });
}

main();

