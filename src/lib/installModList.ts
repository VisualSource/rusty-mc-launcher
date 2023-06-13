export const installModListFromDialog = (modListId: string): Promise<string | null> => new Promise((ok) => {

    document.addEventListener("install_modlist_return", (ev) => {
        const value = (ev as CustomEvent<string>).detail

        if (value === "null") return ok(null);
        return ok(value);
    }, {
        once: true
    });

    document.dispatchEvent(new CustomEvent("install_modlist", {
        detail: modListId
    }));
});