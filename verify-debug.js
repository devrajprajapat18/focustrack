const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1920,1080"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const base = "http://localhost:3000";
  const email = `verify${Date.now()}@test.com`;
  await page.goto(`${base}/register`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.type('input[name="name"]', "Verify");
  await page.type('input[type="email"]', email);
  const pwInputs = await page.$$('input[type="password"]');
  for (const el of pwInputs) await el.type("password123");
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
  ]);
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));
  await page.evaluate(async () => {
    const h3 = [...document.querySelectorAll("h3")].find((h) =>
      h.textContent.includes("Recent Activity"),
    );
    h3.scrollIntoView({ block: "center" });
    await new Promise((r) => setTimeout(r, 800));
  });
  await page.screenshot({
    path: "C:\\Users\\DEVA\\AppData\\Local\\Temp\\opencode\\dashboard-fixed.png",
  });
  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
