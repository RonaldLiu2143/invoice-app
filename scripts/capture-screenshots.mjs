import { chromium } from "playwright";
import { readFileSync } from "fs";

const BASE_URL =
  process.env.SCREENSHOT_URL ?? "https://invoice-app-ronaldliu2143s-projects.vercel.app";
const OUT_DIR = "docs/screenshots";
const demoAppData = JSON.parse(
  readFileSync("docs/demo-data.json", "utf8")
);

async function seed(page) {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate((data) => {
    localStorage.setItem("invoice-app-data", JSON.stringify(data));
  }, demoAppData);
  await page.reload({ waitUntil: "networkidle" });
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await seed(page);
  await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
  await page.getByText("Total Revenue").waitFor({ timeout: 15000 });
  await page.screenshot({ path: `${OUT_DIR}/dashboard.png` });

  await page.goto(`${BASE_URL}/invoices/new`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "New Invoice" }).waitFor({ timeout: 15000 });
  const customerSelect = page.locator("select").first();
  await customerSelect.waitFor({ timeout: 15000 });
  await customerSelect.selectOption("cust-1");
  await page.locator("select").filter({ hasText: "Add from catalog" }).selectOption("prod-1");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT_DIR}/invoice-create.png`, fullPage: true });

  await browser.close();
  console.log("Screenshots saved to", OUT_DIR);
}

main();
