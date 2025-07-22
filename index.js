const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
app.use(express.json());

app.post('/sync', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Load cookies
    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    await page.setCookie(...cookies);

    // Go to Framer CMS
    await page.goto('https://framer.com/projects/MotionLoop-Studio--HK5kUK0Zy8dDw1XQeqHw-cHtr6/cms', {
      waitUntil: 'networkidle2'
    });

    console.log('🔍 Waiting for Sync button...');
    await page.waitForSelector('button:has-text("Sync")', { timeout: 30000 });
    await page.click('button:has-text("Sync")');
    console.log('✅ Clicked Sync');

    await page.waitForSelector('button:has-text("Publish")', { timeout: 30000 });
    await page.click('button:has-text("Publish")');
    console.log('🚀 Clicked Publish');

    await page.waitForTimeout(5000);
    await browser.close();

    res.status(200).json({ success: true, message: 'Synced and Published' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
