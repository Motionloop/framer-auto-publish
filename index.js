// index.js
const express = require('express');
const fs      = require('fs');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

async function syncAndPublish() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // load saved cookies
  const cookies = JSON.parse(fs.readFileSync('cookies.json','utf8'));
  await page.setCookie(...cookies);

  // go to projects list
  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });

  // click your project link
  const projectLink = await page.waitForSelector('a[href*="MotionLoop-Studio"]', { visible: true });
  await projectLink.click();

  // click CMS
  const cmsBtn = await page.waitForXPath("//button[contains(normalize-space(.),'CMS')]", { visible: true, timeout: 30000 });
  await cmsBtn.click();

  // switch to Airtable tab
  const airtableTab = await page.waitForXPath("//span[contains(normalize-space(.),'Airtable')]", { visible: true });
  await airtableTab.click();

  // Sync
  const syncBtn = await page.waitForXPath("//button[contains(normalize-space(.),'Sync')]", { visible: true, timeout: 30000 });
  await syncBtn.click();

  // Publish
  const pubBtn = await page.waitForXPath("//button[contains(normalize-space(.),'Publish')]", { visible: true, timeout: 30000 });
  await pubBtn.click();

  // wait a moment, then screenshot
  await page.waitForTimeout(3000);
  const img = await page.screenshot({ fullPage: true });
  await browser.close();
  return img;
}

app.post('/sync', async (req, res) => {
  try {
    const imgBuffer = await syncAndPublish();
    const dataUrl = 'data:image/png;base64,' + imgBuffer.toString('base64');
    return res.json({ success: true, screenshot: dataUrl });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (_, res) => res.send('🟢 Framer Auto-Publish is running'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
