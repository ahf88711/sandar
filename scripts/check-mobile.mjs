import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const WIDTHS = [320, 375, 390, 430, 768, 1280];

function fail(msg) {
  console.error(`FAIL ${msg}`);
  process.exitCode = 1;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 740 });
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForSelector(".menu-card");

    const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
    if (dir !== "rtl") fail(`${width}: html dir is ${dir}`);

    const overflow = await measureOverflow(page);
    if (overflow > 1) fail(`${width}: menu overflow ${overflow}px`);

    const newGame = page.getByRole("button", { name: "لعبة جديدة" });
    const box = await newGame.boundingBox();
    if (!box || box.height < 44) fail(`${width}: new game button too small ${box?.height}`);

    await newGame.click();
    await page.getByRole("button", { name: "ابدأ القيادة" }).click();
    await page.waitForSelector(".layout");
    const closeTutorial = page.getByRole("button", { name: "إغلاق" });
    if (await closeTutorial.count()) await closeTutorial.click();

    const playOverflow = await measureOverflow(page);
    if (playOverflow > 1) fail(`${width}: play overflow ${playOverflow}px`);

    const endYear = page.locator(width >= 980 ? ".end-year-desktop" : ".end-year-bar .end-year");
    const endBox = await endYear.boundingBox();
    if (!endBox || endBox.height < 44) fail(`${width}: end year not reachable ${JSON.stringify(endBox)}`);
    if (width < 980 && endBox.y + endBox.height > 740) fail(`${width}: end year below fold`);

    if (width < 980) {
      const nav = await page.locator(".mobile-nav").boundingBox();
      if (!nav) fail(`${width}: missing bottom nav`);
      const items = page.locator(".mobile-nav button");
      if ((await items.count()) !== 5) fail(`${width}: nav count`);
      const first = await items.nth(0).boundingBox();
      if (!first || first.height < 44) fail(`${width}: nav item short ${first?.height}`);
    } else {
      const side = await page.locator(".sidebar").evaluate((el) => getComputedStyle(el).display);
      if (side === "none") fail(`${width}: sidebar hidden on desktop`);
    }

    const screens = ["الاقتصاد", "المشاريع", "العالم"];
    for (const label of screens) {
      if (width < 980) await page.locator(".mobile-nav button", { hasText: label }).click();
      else await page.locator(".nav-btn", { hasText: label === "الاقتصاد" ? "الاقتصاد" : label === "المشاريع" ? "المشاريع" : "العلاقات الدولية" }).first().click();
      await page.waitForTimeout(80);
      const o = await measureOverflow(page);
      if (o > 1) fail(`${width}: ${label} overflow ${o}px`);
    }

    if (width < 980) {
      await page.locator(".mobile-nav button", { hasText: "المزيد" }).click();
      await page.waitForSelector(".more-sheet");
      const sheetBtn = page.locator(".sheet-item").first();
      const sb = await sheetBtn.boundingBox();
      if (!sb || sb.height < 44) fail(`${width}: more item too small`);
      await page.locator(".sheet-item").first().click();
    }

    mkdirSync("/tmp/sandar-mobile", { recursive: true });
    await page.screenshot({ path: `/tmp/sandar-mobile/${width}.png`, fullPage: false });
    console.log(`OK ${width}px`);
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE, { waitUntil: "networkidle" });
  }

  await browser.close();
  if (process.exitCode) {
    console.error("Mobile checks failed");
    process.exit(process.exitCode);
  }
  console.log("All viewport checks passed");
}

async function measureOverflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return Math.max(doc.scrollWidth - doc.clientWidth, body.scrollWidth - body.clientWidth);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
