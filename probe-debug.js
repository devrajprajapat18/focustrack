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
  const email = `probe2${Date.now()}@test.com`;
  await page.goto(`${base}/register`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.type('input[name="name"]', "Probe");
  await page.type('input[type="email"]', email);
  const pwInputs = await page.$$('input[type="password"]');
  for (const el of pwInputs) await el.type("password123");
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 60000 }).catch(() => {}),
  ]);
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 4000));

  const data = await page.evaluate(async () => {
    const h3 = [...document.querySelectorAll("h3")].find((h) =>
      h.textContent.includes("Recent Activity"),
    );
    h3.scrollIntoView({ block: "center" });
    await new Promise((r) => setTimeout(r, 1000));
    const card = h3.closest("div.rounded-2xl");
    const r = card.getBoundingClientRect();
    // All non-transparent boxes intersecting expanded row area
    const all = [...document.querySelectorAll("main div")].filter((el) => {
      const b = el.getBoundingClientRect();
      if (!(b.height > 40 && b.width > 200)) return false;
      if (!(b.top < r.bottom + 40 && b.bottom > r.top - 40)) return false;
      const bg = getComputedStyle(el).backgroundColor;
      return bg !== "rgba(0, 0, 0, 0)" && !bg.includes("15, 23, 42") && !bg.includes("249, 250, 251");
    }).map((el) => {
      const b = el.getBoundingClientRect();
      // DOM path snippet
      let p = [];
      let n = el;
      for (let i = 0; i < 4 && n && n.tagName !== "MAIN"; i++) {
        p.unshift(n.tagName + "." + String(n.className).split(" ").slice(0, 3).join("."));
        n = n.parentElement;
      }
      return {
        rect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) },
        bg: getComputedStyle(el).backgroundColor,
        text: (el.querySelector("h3")?.textContent || el.textContent || "").trim().slice(0, 40),
        path: p.join(" < "),
      };
    });
    return { recent: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, boxes: all };
  });
  console.log(JSON.stringify(data, null, 1));
  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
