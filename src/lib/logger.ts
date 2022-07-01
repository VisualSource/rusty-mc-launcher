import { Log } from "./invoke";

const LoggerError = console.error;
const LoggerDebug = console.debug;
const LoggerInfo = console.info;
const LoggerWarn = console.warn;

const LoggerCore = (type: "info" | "warn" | "debug" | "error" | null, msg?: any): void => {
    if(msg instanceof Error) {
        Log(msg.message,type);
    } else if(typeof msg === "string") {
        Log(msg,type);
    } else {
        const message = JSON.stringify(msg);
        Log(message,type);
    }
}

console.error = (msg?: any, ...input: any[])=>{
  LoggerError(msg,...input);
  LoggerCore("error",msg);
}

console.debug = (msg?: any, ...input: any[]) => {
    LoggerDebug(msg,...input);
    LoggerCore("debug",msg);
}
console.log = (msg?: any, ...input: any[]) => {
    LoggerInfo(msg,...input);
    LoggerCore("info",msg);
}

console.warn = (msg?: any, ...input: any[]) => {
    LoggerWarn(msg,...input);
    LoggerCore("warn",msg);
}