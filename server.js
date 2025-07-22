const express = require('express');
const puppeteer = require('puppeteer-core');
const cookies = require('./cookies.json');
const { editorUrl } = require('./config');

const app = express();
app.use(express.json());

app.post('/trigger', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
      executablePath: '/usr/bin/google-chrome'
    });

    const page = await browser.newPage();
    await page.setCookie(...cookies);
    await page.goto(editorUrl, { waitUntil: 'networkidle2' });

    // Click Sync
    await page.waitForSelector('button:has-text("Sync")', { timeout: 15000 });
    await page.click('button:has-text("Sync")');
    await page.waitForTimeout(4000);

    // Click Publish
   await page.click('button:has-text("Publish")'); // open dropdown
await page.waitForSelector('button:has-text("Update")', { timeout: 5000 });
await page.click('button:has-text("Update")');


    await page.waitForTimeout(3000);
    await browser.close();

    res.json({ success: true, message: 'Framer project published' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
