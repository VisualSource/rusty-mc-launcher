export const selectProfileFromDialog = (config?: { games?: string[]; loaders?: string[]; }): Promise<string | null> => new Promise((ok) => {

    document.addEventListener("mcl::done::profile-select", (ev) => {
        const value = (ev as CustomEvent<string>).detail

        if (value === "null") return ok(null);
        return ok(value);
    }, {
        once: true
    });

    document.dispatchEvent(new CustomEvent("mcl::open::profile-select", {
        detail: config
    }));
});