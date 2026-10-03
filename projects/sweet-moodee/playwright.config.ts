import { defineConfig, devices } from "@playwright/test";

// Uses the Chromium already installed on the machine (no browser download).
const executablePath = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  webServer: { command: "npx astro preview --port 4329", port: 4329, reuseExistingServer: false },
  use: { baseURL: "http://localhost:4329", launchOptions: { executablePath } },
  projects: [
    { name: "phone", use: { ...devices["Pixel 7"], browserName: "chromium", viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
  ],
});
