import { type ChildProcessByStdio, spawn, spawnSync } from "node:child_process";
import { Builder, Capabilities, type WebDriver } from "selenium-webdriver";
import { beforeAll, afterAll } from "vitest";
import type Stream from "node:stream";
import { resolve } from "node:path";
import { homedir } from "node:os";

const application = resolve(__dirname, "../../src-tauri/target/release/app");

let driver: WebDriver;
let tauriDriver: ChildProcessByStdio<Stream.Writable, null, null>;

beforeAll(async () => {

    spawnSync("cargo", ["build", "--release"]);

    tauriDriver = spawn(resolve(homedir(), ".cargo", "bin", "tauri-driver"), [], { stdio: [null, process.stdout, process.stderr] });

    const capabilities = new Capabilities();
    capabilities.set("tauri:options", { application });
    capabilities.setBrowserName("wry");

    driver = await new Builder()
        .withCapabilities(capabilities)
        .usingServer("http://127.0.0.1:4444")
        .build();
});

afterAll(async () => {
    await driver.quit();
    tauriDriver.kill();
});