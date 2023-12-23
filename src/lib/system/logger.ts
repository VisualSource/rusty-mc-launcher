import createDebug, { type Debugger } from "debug";
import * as tauriLog from "tauri-plugin-log-api";

const levels = ["error", "warn", "info", "debug"] as const;
type LoggerLevel = (typeof levels)[number];
type Logger = Record<LoggerLevel, Debugger>;

const logger: Logger = (() => {
  return levels.reduce((acc, value) => {
    const key = `mcrl:${value}`;
    acc[value] = createDebug(key);
    acc[value].color = "green";
    acc[value].log = (...args: [string, ...unknown[]]) => {
      const [msg, ...rest] = args;
      tauriLog[value as keyof typeof tauriLog](msg.replace(key + " ", ""));
      if (rest.length >= 1) {
        console.debug(...rest);
      }
    };
    return acc;
  }, {} as Logger);
})();
localStorage.debug = import.meta.env.PUBLIC_VITE_DEBUG ?? "mrcl:error";
logger.debug.enabled = import.meta.env.DEV;

export const initLogger = () =>
  tauriLog.attachConsole().then(() => logger.info("Logger Ready"));
export default logger;
