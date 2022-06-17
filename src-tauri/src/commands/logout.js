window.__LOAD = "(:URL)";
window._0 = ev => console.log(ev);
window._1 = err => console.error(err);
window.__RUN = () => {
    if (location.href === "chrome-error://chromewebdata/") {
        __TAURI_POST_MESSAGE__({
            cmd: "auth_error",
            callback: 0,
            error: 1,
            error: "No Internet"
        });
        return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.has("lc")) {
        document.cookie.split(";").forEach(c=>document.cookie=c.replace(/^ +/,"").replace(/=.*/,"=;expires="+new Date().toUTCString()+";path=/"));
        __TAURI_POST_MESSAGE__({
            cmd: "logout_done",
            callback: 0,
            error: 1
        });
        return;
    }
    if (params.has("error")) {
        __TAURI_POST_MESSAGE__({
            cmd: "auth_error",
            callback: 0,
            error: 1,
            error: params?.get("error_description") ?? "Unkown Error"
        });
        return;
    }
    setTimeout(window.__RUN, 2000);
};
window.addEventListener("load", window.__RUN);