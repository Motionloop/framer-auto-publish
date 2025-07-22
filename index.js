const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

app.use(express.json()); // required to accept JSON body (even if empty)

app.post('/sync', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Load cookies
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    await page.setCookie(...cookies);

    // Go to project dashboard
    await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });

    // Click project
    await page.waitForSelector('a[href*="MotionLoop-Studio"]');
    await page.click('a[href*="MotionLoop-Studio"]');

    // Click CMS
    await page.waitForSelector('button:has-text("CMS")');
    await page.click('button:has-text("CMS")');

    // Click Airtable
    await page.waitForSelector('span:text("Airtable")');
    await page.click('span:text("Airtable")');

    // Click Sync
    await page.waitForSelector('button:has-text("Sync")', { timeout: 30000 });
    await page.click('button:has-text("Sync")');

    // Click Publish
    await page.waitForSelector('button:has-text("Publish")', { timeout: 30000 });
    await page.click('button:has-text("Publish")');

    // Wait + Screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'framer-publish-confirm.png', fullPage: true });

    await browser.close();

    res.status(200).json({ message: '✅ Synced and published successfully!' });
  } catch (err) {
    console.error('❌ Error during sync:', err);
    res.status(500).json({ error: '❌ Sync failed', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('🟢 Framer Auto Publisher is running');
});

app.listen(port, () => {
  console.log(`🟢 Server live at http://localhost:${port}`);
});
