import debug from "debug";

const error = debug("mcrl:error");
const log = debug("mcrl:log");
const warn = debug("mcrl:warn");
const info = debug("mcrl:info");
const debug_log = debug("mcrl:debug");

localStorage.debug = import.meta.env.PUBLIC_VITE_DEBUG ?? "mrcl:error";
debug_log.log = console.debug.bind(console);
info.log = console.info.bind(console);
warn.log = console.warn.bind(console);
error.log = console.error.bind(console);
log.log = console.log.bind(console);

info("Loaded Logger");

debug_log.enabled = import.meta.env.DEV;

const logger = {
    error,
    log,
    warn,
    info,
    debug: debug_log
};

export default logger;




