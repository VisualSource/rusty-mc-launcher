import { convertFileSrc } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { BaseDirectory, readDir } from "@tauri-apps/plugin-fs";

export const loadThemes = async () => {
    const root = await appDataDir();
    const themesFolder = await join(root, "themes");

    const themeFiles = await readDir("themes", { baseDir: BaseDirectory.AppData });
    const themes = [];
    for (const file of themeFiles) {
        if (!file.isFile || !file.name.endsWith(".css") || file.isSymlink || file.isDirectory) continue;
        const name = file.name.replace(".css", "");
        const path = await join(themesFolder, file.name);

        themes.push({
            title: name.replaceAll(/[_-]/g, "").replace(/^\w/, name[0].toUpperCase()),
            name,
            path: convertFileSrc(path)
        });
    }
    return themes;
}

export const initThemes = async () => {
    try {
        const themes = await loadThemes();
        for (const theme of themes) {
            const themeStyle = document.createElement("link");
            themeStyle.setAttribute("rel", "stylesheet");
            themeStyle.setAttribute("href", theme.path);
            document.head.appendChild(themeStyle);
        }

        const currentTheme = localStorage.getItem("theme");
        if (currentTheme) {
            const html = document.querySelector("html");
            html?.setAttribute("data-theme", currentTheme);
        }
    } catch (error) {
        console.error(error);
    }
}