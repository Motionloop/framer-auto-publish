// index.js
const puppeteer = require('puppeteer');
const fs = require('fs');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });

  await page.waitForSelector('a[href*="MotionLoop-Studio"]');
  await page.click('a[href*="MotionLoop-Studio"]');

  await page.waitForSelector('button:has-text("CMS")');
  await page.click('button:has-text("CMS")');

  await page.waitForSelector('span:text("Airtable")');
  await page.click('span:text("Airtable")');

  await page.waitForSelector('button:has-text("Sync")', { timeout: 30000 });
  await page.click('button:has-text("Sync")');

  await page.waitForSelector('button:has-text("Publish")', { timeout: 30000 });
  await page.click('button:has-text("Publish")');

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'framer-publish-confirm.png', fullPage: true });

  await browser.close();

  res.send('✅ Synced and published with screenshot!');
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
