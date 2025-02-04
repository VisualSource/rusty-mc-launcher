import { error } from "@tauri-apps/plugin-log";

export function logCatchError(err: unknown) {
	let message: string | undefined;
	if (err instanceof Error) {
		message = err.message;
	} else if (typeof err === "string") {
		message = err;
	}

	if (message) error(message);

	console.error(err);
}
