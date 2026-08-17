import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4173";
mkdirSync("/tmp/sandar-mobile", { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function shot(name) {
  await page.screenshot({ path: `/tmp/sandar-mobile/${name}.png` });
}

for (const width of [320, 390]) {
  await page.setViewportSize({ width, height: 740 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await shot(`${width}-menu`);
  await page.getByRole("button", { name: "لعبة جديدة" }).click();
  await shot(`${width}-newgame`);
  await page.getByRole("button", { name: "ابدأ القيادة" }).click();
  const close = page.getByRole("button", { name: "إغلاق" });
  if (await close.count()) await close.click();
  await shot(`${width}-home`);
  await page.locator(".mobile-nav button", { hasText: "الاقتصاد" }).click();
  await page.waitForTimeout(80);
  await shot(`${width}-economy`);
  await page.locator(".mobile-nav button", { hasText: "المشاريع" }).click();
  await page.waitForTimeout(80);
  await shot(`${width}-projects`);
  await page.locator(".mobile-nav button", { hasText: "المزيد" }).click();
  await page.waitForTimeout(80);
  await shot(`${width}-more`);
  await page.locator(".sheet-item", { hasText: "القرارات والأحداث" }).click();
  await page.waitForTimeout(80);
  await shot(`${width}-decisions`);
}

await browser.close();
console.log("shots written to /tmp/sandar-mobile");
