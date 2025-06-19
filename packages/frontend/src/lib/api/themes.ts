import {
	BaseDirectory,
	type DirEntry,
	exists,
	mkdir,
	readDir,
	readTextFile,
} from "@tauri-apps/plugin-fs";
import { appDataDir, join } from "@tauri-apps/api/path";
import { error } from "@tauri-apps/plugin-log";
import { toastError } from "../toast";

type Theme = {
	name: string;
	id: string;
	darkTheme?: string;
	lightTheme?: string;
};

const loadTheme = async (file: DirEntry, themesFolder: string) => {
	if (!file.isFile || file.isSymlink || !file.name.endsWith(".css")) {
		return null;
	}

	const filepath = await join(themesFolder, file.name);
	const content = await readTextFile(filepath, {
		baseDir: BaseDirectory.AppData,
	});

	const stylesheet = new CSSStyleSheet();
	stylesheet.replaceSync(content);

	let themeName: string | undefined;
	let themeId: string | undefined;
	let lightTheme: string | undefined;
	let darkTheme: string | undefined;

	for (const rule of stylesheet.cssRules) {
		switch ((rule as CSSStyleRule).selectorText) {
			case ".config": {
				if (
					!(rule as CSSStyleRule).styleMap.has("--name") ||
					!(rule as CSSStyleRule).styleMap.has("--id")
				) {
					throw new Error(`Theme from file '${file.name}' has invalid config`);
				}

				themeName = (rule as CSSStyleRule).styleMap
					.get("--name")
					?.toString()
					.replaceAll('"', "");
				themeId = (rule as CSSStyleRule).styleMap
					.get("--id")
					?.toString()
					.replaceAll('"', "");
				break;
			}
			case ":root": {
				lightTheme = rule.cssText;
				break;
			}
			case ".dark": {
				darkTheme = rule.cssText;
				break;
			}
		}
	}

	if (!themeId || !themeName)
		throw new Error(`Missing theme config from file '${file.name}'`);
	if (themeId === "default")
		throw new Error(
			`Theme from file "${file.name}" can not have id of 'default'`,
		);
	lightTheme = lightTheme?.replace(
		/^(:root)/,
		`:root[data-theme="${themeId}"]`,
	);
	darkTheme = darkTheme?.replace(/^(.dark)/, `.dark[data-theme="${themeId}"]`);

	return {
		name: themeName,
		id: themeId,
		darkTheme,
		lightTheme,
	} as Theme;
};

export const getThemesDirectory = async () => {
	const root = await appDataDir();
	const themesFolder = await join(root, "themes");
	return themesFolder;
}

export const loadThemes = async () => {
	const themesFolder = await getThemesDirectory();

	const doesExists = await exists(themesFolder);
	if (!doesExists) {
		await mkdir("themes", { baseDir: BaseDirectory.AppData });
	}

	const themeFiles = await readDir("themes", {
		baseDir: BaseDirectory.AppData,
	});

	const results = await Promise.allSettled(
		themeFiles.map((e) => loadTheme(e, themesFolder)),
	);

	const themes = new Map<string, Theme>();
	const erroredThemes: Error[] = [];
	for (const result of results) {
		switch (result.status) {
			case "fulfilled": {
				if (!result.value) break;
				if (themes.has(result.value.id)) {
					erroredThemes.push(
						new Error(`Theme with id of '${result.value.id}' already exists`, {
							cause: result.value,
						}),
					);
					break;
				}

				themes.set(result.value.id, result.value);
				break;
			}
			case "rejected": {
				erroredThemes.push(result.reason);
				break;
			}
		}
	}

	return {
		themes,
		errors: erroredThemes,
	};
};

export const initThemes = async () => {
	try {
		const useLight = localStorage.getItem("useLight");
		if (useLight === "1") {
			const root = document.querySelector("html");
			root?.classList.remove("dark");
		}

		const { themes, errors } = await loadThemes();
		if (errors.length >= 1) {
			toastError({
				title: "Theme Errors",
				description: `${errors.length} theme${errors.length > 1 ? "s" : ""} failed to load.`,
			});
			for (const err of errors) {
				error(err.message, { file: "theme.css" });
			}
		}

		const stylesheet = new CSSStyleSheet();

		for (const [_, theme] of themes) {
			try {
				if (theme.darkTheme) stylesheet.insertRule(theme.darkTheme);
				if (theme.lightTheme) stylesheet.insertRule(theme.lightTheme);
			} catch (err) {
				toastError({
					title: "Theme Error",
					description: "Failed to init themes",
					error: err as Error,
				});
				error((err as Error)?.message ?? "Css insert error");
			}
		}

		document.adoptedStyleSheets = [stylesheet];

		const currentTheme = localStorage.getItem("theme");
		if (currentTheme) {
			const html = document.querySelector("html");
			html?.setAttribute("data-theme", currentTheme);
		}
	} catch (error) {
		toastError({
			title: "Theme Error",
			description: "Failed to init themes",
			error: error as Error,
		});
		console.error(error);
	}
};
