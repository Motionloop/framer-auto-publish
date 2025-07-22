const puppeteer = require("puppeteer");
const express = require("express");
const app = express();

app.use(express.json());

app.post("/sync", async (req, res) => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    // Set user agent to avoid being blocked
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
    );

    // Set session cookie
    await page.setCookie({
      name: "session",
      value: "dee9a08a-49cf-9143-da3435312caf",
      domain: ".framer.com",
      path: "/",
      httpOnly: false,
      secure: true,
    });

    console.log("Navigating to Framer CMS...");
    await page.goto(
      "https://framer.com/projects/MotionLoop-Studio--HK5kUK0Zy8dDw1XQeqHw-cHtr6?node=eTZMN8eWT",
      {
        waitUntil: "networkidle2",
        timeout: 60000,
      }
    );

    await page.screenshot({ path: "framer-debug.png", fullPage: true });
console.log("📸 Screenshot taken");


    // Click Sync
    await page.waitForSelector('button:has-text("Sync")', { timeout: 15000 });
    await page.click('button:has-text("Sync")');
    console.log("✅ Clicked Sync");

    await page.waitForTimeout(3000);

    // Click Publish
    await page.waitForSelector('button:has-text("Publish")', { timeout: 15000 });
    await page.click('button:has-text("Publish")');
    console.log("✅ Clicked Publish");

    await page.waitForTimeout(1500);

    // Click Update
    await page.waitForSelector('button:has-text("Update")', { timeout: 15000 });
    await page.click('button:has-text("Update")');
    console.log("✅ Clicked Update");

    await page.waitForTimeout(3000);
    await browser.close();

    res.json({ status: "Success", message: "Framer synced & published" });
  } catch (err) {
    console.error("❌ Error:", err.message);
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
