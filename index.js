const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/sync', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Load cookies
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    await page.setCookie(...cookies);

    // Go to CMS page
    await page.goto('https://framer.com/projects/MotionLoop-Studio--HK5kUK0Zy8dDw1XQeqHw-cHtr6/cms', {
      waitUntil: 'networkidle2',
    });

    // Take screenshot for debug
    await page.screenshot({ path: 'screenshot.png', fullPage: true });

    // Try to find Sync button using XPath
    const [syncBtn] = await page.$x("//button[contains(text(), 'Sync')]");
    if (!syncBtn) throw new Error("❌ 'Sync' button not found");

    await syncBtn.click();
    console.log('✅ Clicked Sync');

    await page.waitForXPath("//button[contains(text(), 'Publish')]", { timeout: 30000 });
    const [publishBtn] = await page.$x("//button[contains(text(), 'Publish')]");
    await publishBtn.click();
    console.log('🚀 Clicked Publish');

    await page.waitForTimeout(5000);
    await browser.close();

    res.status(200).send("✅ Synced and Published!");
  } catch (err) {
    await page.screenshot({ path: 'error.png', fullPage: true });

    const buffer = fs.readFileSync('error.png');
    res.writeHead(500, {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
});

app.listen(process.env.PORT || 8080, () => {
  console.log('🚀 Server running...');
});
