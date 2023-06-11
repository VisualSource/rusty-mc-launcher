export const selectProfileFromDialog = (config?: { game?: string; loader?: string[]; }): Promise<string | null> => new Promise((ok) => {

    document.addEventListener("profile_selected", (ev) => {
        const value = (ev as CustomEvent<string>).detail

        if (value === "null") return ok(null);
        return ok(value);
    }, {
        once: true
    });

    document.dispatchEvent(new CustomEvent("profile_select", {
        detail: config
    }));
});