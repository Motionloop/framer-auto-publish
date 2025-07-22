const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const config = require('./config');

const app = express();

app.get('/', (req, res) => {
  res.send('Server is running.');
});

app.post('/trigger', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
    await page.setCookie(...cookies);

    await page.goto(config.editorUrl, { waitUntil: 'networkidle2' });

    // Wait and click "Sync" button
    await page.waitForSelector('button:has-text("Sync")', { timeout: 10000 });
    await page.click('button:has-text("Sync")');

    // Wait for the sync to finish (adjust if needed)
    await page.waitForTimeout(3000);

    // Click Publish > Update
    await page.click('button:has-text("Publish")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Update")');

    await browser.close();
    res.send('Done');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed');
  }
});

app.listen(process.env.PORT || 3000);
