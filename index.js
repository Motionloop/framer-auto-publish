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

  // Set your Framer session cookie
  await page.setCookie({
    name: "session",
    value: "e6ea9a8c-0dba-49cf-9143-da3435312caf",
    domain: ".framer.com",
    path: "/",
    httpOnly: false,
    secure: true,
  });

  try {
    console.log("Navigating to Framer CMS...");
    await page.goto("https://framer.com/projects/MotionLoop-Studio--HK5kUK0Zy8dDw1XQeqHw-cHtr6", {
      waitUntil: "networkidle2",
    });

    // Wait and click Sync
    await page.waitForSelector('button:text("Sync")', { timeout: 10000 });
    await page.click('button:text("Sync")');
    console.log("Clicked Sync");

    await page.waitForTimeout(4000); // Wait for sync to complete

    // Click Publish
    await page.waitForSelector('button:text("Publish")', { timeout: 10000 });
    await page.click('button:text("Publish")');
    console.log("Clicked Publish");

    await page.waitForTimeout(1000);

    // Click Update in modal
    await page.waitForSelector('button:text("Update")', { timeout: 10000 });
    await page.click('button:text("Update")');
    console.log("Clicked Update");

    await page.waitForTimeout(3000);
    await browser.close();

    res.json({ status: "Success", message: "Framer site synced and published!" });
  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
