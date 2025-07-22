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
    // 1. Go to Framer login
    await page.goto("https://framer.com/login", { waitUntil: "networkidle2" });

    // 2. Login (replace with your credentials)
    await page.type('input[name="email"]', "your@email.com", { delay: 50 });
    await page.click("button[type=submit]");

    await page.waitForTimeout(1000);
    await page.type('input[name="password"]', "yourPassword", { delay: 50 });
    await page.click("button[type=submit]");

    // 3. Wait until logged in
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // 4. Go to your specific site’s dashboard
    await page.goto("https://framer.com/projects/YOUR_PROJECT_ID", {
      waitUntil: "networkidle2",
    });

    // 5. Click "Sync"
    await page.waitForSelector('button:has-text("Sync")');
    await page.click('button:has-text("Sync")');

    await page.waitForTimeout(3000); // wait for sync to finish

    // 6. Click "Publish" > "Update"
    await page.click('button:has-text("Publish")');
    await page.waitForTimeout(1000);
    await page.click('button:has-text("Update")');

    await page.waitForTimeout(3000); // wait to complete
    await browser.close();

    res.json({ status: "success", message: "Framer site synced & published" });
  } catch (err) {
    await browser.close();
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on ${PORT}`));
