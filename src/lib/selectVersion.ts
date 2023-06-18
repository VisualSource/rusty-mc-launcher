export const selectVersionDialog = (config: { games: string[], loaders: string[] }): Promise<{ loader: string; game: string; } | null> => new Promise((ok) => {

    document.addEventListener("mcl::done::version-select", (ev) => {
        const value = (ev as CustomEvent<{ loader: string; game: string; } | null>).detail
        return ok(value);
    }, {
        once: true
    });

    document.dispatchEvent(new CustomEvent("mcl::open::version-select", {
        detail: config
    }));
});