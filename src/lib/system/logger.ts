import createDebug, { type Debugger } from "debug";
import {
	warn,
	error,
	debug,
	info,
	attachConsole,
} from "@tauri-apps/plugin-log";

const levels = [
	{ name: "error", color: "red", logger: error },
	{ name: "warn", color: "yellow", logger: warn },
	{ name: "info", color: "blue", logger: info },
	{ name: "debug", color: "green", logger: debug },
	{ name: "trace", color: "green", logger: debug },
	{ name: "verbose", color: "green", logger: debug },
] as const;

const namespaces = ["app", "auth"] as const;
type Level = Record<(typeof levels)[number]["name"], Debugger>;
type Loggers = Record<(typeof namespaces)[number], Level>;

function initLogger() {
	const root = createDebug("rmcl");

	const loggers = namespaces.reduce((acc, namespace) => {
		const ns = root.extend(namespace);
		acc[namespace] = levels.reduce((a, level) => {
			a[level.name] = ns.extend(level.name);
			a[level.name].color = level.color;
			a[level.name].log = level.logger;
			return a;
		}, {} as Level);
		return acc;
	}, {} as Loggers);

	localStorage.debug = import.meta.env.VITE_DEBUG ?? "rmcl:*:error";

	return loggers;
}
export const { app, auth } = initLogger();

export const attachLogger = () =>
	attachConsole().then(() => app.info("Logger Ready"));
export default app;
