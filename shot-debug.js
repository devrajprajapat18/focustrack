const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1920,1080"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Reuse existing login: login via API then set cookie by visiting
  const base = "http://localhost:3000";
  await page.goto(`${base}/login`, { waitUntil: "networkidle0", timeout: 60000 });
  // find debug user creds — we registered debug@... earlier; just register new
  const email = `probe${Date.now()}@test.com`;
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
  await new Promise((r) => setTimeout(r, 2500));

  const result = await page.evaluate(async () => {
    const out = [];
    // Find Recent Activity card
    const titles = [...document.querySelectorAll("h3")].filter((h) =>
      h.textContent.includes("Recent Activity"),
    );
    const card = titles[0]?.closest("div.rounded-2xl") || titles[0]?.parentElement?.parentElement;
    if (!card) return { error: "recent activity card not found" };
    card.scrollIntoView({ block: "center" });
    await new Promise((r) => setTimeout(r, 800));
    const r = card.getBoundingClientRect();
    const points = [];
    for (let dx = 5; dx <= 120; dx += 15) {
      points.push([r.x + r.width + dx, r.y + r.height / 2]);
    }
    for (let dx = 5; dx <= 120; dx += 15) {
      points.push([r.x + r.width + dx, r.y + r.height - 20]);
    }
    const seen = new Set();
    for (const [x, y] of points) {
      const els = document.elementsFromPoint(x, y).map((el) => {
        const b = el.getBoundingClientRect();
        const cls = (el.className && el.className.baseVal !== undefined ? "" : String(el.className)).slice(0, 160);
        const bg = getComputedStyle(el).backgroundColor;
        const key = `${el.tagName}|${cls}|${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)}x${Math.round(b.height)}|${bg}`;
        return { key, tag: el.tagName, cls, rect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }, bg };
      });
      out.push({ point: [Math.round(x), Math.round(y)], els });
    }
    // Also: list all ancestor/sibling boxes overlapping the recent card's expanded area
    const all = [...document.querySelectorAll("main div")].filter((el) => {
      const b = el.getBoundingClientRect();
      return (
        b.width > r.width && b.x <= r.x + 10 && b.right >= r.right - 10 &&
        Math.abs(b.y - r.y) < 120 && el !== card && !card.contains(el) && !el.contains(card)
      );
    }).map((el) => {
      const b = el.getBoundingClientRect();
      return { tag: el.tagName, cls: String(el.className).slice(0, 200), rect: { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }, bg: getComputedStyle(el).backgroundColor };
    });
    out.push({ overlappingSiblings: all });
    return out;
  });
  console.log(JSON.stringify(result, null, 1).slice(0, 6000));
  await browser.close();
})().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
