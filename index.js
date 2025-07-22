// index.js
const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

async function syncAndPublish() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // load your saved login cookies
  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  // go to your projects list
  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });

  // click your MotionLoop Studio project link
  await page.waitForSelector('a[href*="MotionLoop-Studio"]', { visible: true });
  await page.click('a[href*="MotionLoop-Studio"]');

  // click the "CMS" button (XPath lookup)
  const [cmsBtn] = await page.$x("//button[contains(., 'CMS')]");
  await cmsBtn.click();

  // switch to the Airtable tab
  const [airtableTab] = await page.$x("//span[contains(., 'Airtable')]");
  await airtableTab.click();

  // hit Sync
  const [syncBtn] = await page.$x("//button[contains(., 'Sync')]");
  await syncBtn.click();

  // then Publish
  const [pubBtn] = await page.$x("//button[contains(., 'Publish')]");
  await pubBtn.click();

  // wait a moment, grab a screenshot for debugging if you like
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'framer-publish-confirm.png', fullPage: true });

  await browser.close();
}

app.post('/sync', async (req, res) => {
  try {
    await syncAndPublish();
    res.json({ success: true, message: '✅ Synced & published!' });
  } catch (e) {
    console.error('Sync error:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/', (req, res) => res.send('🟢 Framer-Auto-Publish is up'));

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
