// the url to loaded by bootstarp
window.__LOAD = "(:URL)";
// _0 and _1 are tauri callbacks
window._0 = (ev) => console.log(ev); 
window._1 = (err) => console.error(err);
window.__RUN = () => {
    if(location.href === "chrome-error://chromewebdata/"){
        __TAURI_POST_MESSAGE__({ cmd: "auth_error", callback: 0, error: 1, error: "No Internet" });
        return;
    }
    const params = new URLSearchParams(window.location.search);
    if(params.has("code")){
        // required callback function
        __TAURI_POST_MESSAGE__({ cmd: "login_done", callback: 0, error: 1, code: params.get("code") });
        return;
    }
    // test for errors
    //https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow
    if(params.has("error")){
        __TAURI_POST_MESSAGE__({ cmd: "auth_error", callback: 0, error: 1, error: params?.get("error_description") ?? "Unkown Error" });
        return;
    }
    // test again in 2ms
    setTimeout(window.__RUN,2000);
}
window.addEventListener("load",window.__RUN);