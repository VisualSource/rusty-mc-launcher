import { By, type WebDriver } from "selenium-webdriver";
import { describe, expect, it } from "vitest";

declare const driver: WebDriver;

describe("Tauri", () => {
    it("should launch", async () => {
        const body = await driver.findElement(By.css("#root"));
        const isSeen = await body.isDisplayed();

        expect(isSeen).to.be.true("boolean", "Failed to find #root");
    });
});