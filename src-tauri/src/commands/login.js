window.__LOAD = "(:URL)";
window._0 = ev => console.log(ev);
window._1 = err => console.error(err);
window.__RUN = () => {
    document.cookie.split(";").forEach(c=>document.cookie=c.replace(/^ +/,"").replace(/=.*/,"=;expires="+new Date().toUTCString()+";path=/"));
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
    if (params.has("code")) {
        const bg = document.createElement('style');
        bg.textContent = `body {
                margin: 0;
                height: 100vh;
                width: 100vw;
                background: #f2f2f2;
                background-image: url("/images/mc_bg.svg");
                background-repeat: no-repeat, no-repeat;
                background-position: center center, center center;
                background-size: cover, cover;
                display: flex;
                justify-content: center;
                align-content: center;
                align-items: center;
                color: black;
                font-family: -apple-system, "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Open Sans", "Helvetica Neue", "blueprint-icons-16", sans-serif;
            }`;
        document.head.appendChild(bg);
        document.body.innerHTML = "<h2>Loading!</h2>"
        __TAURI_POST_MESSAGE__({
            cmd: "login_done",
            callback: 0,
            error: 1,
            code: params.get("code")
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