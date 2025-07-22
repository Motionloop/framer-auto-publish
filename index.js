// index.js
const express   = require('express');
const fs        = require('fs');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT   = process.env.PORT || 8080;
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function clickByText(page, selector, text) {
  const clicked = await page.evaluate((sel, txt) => {
    const el = Array.from(document.querySelectorAll(sel))
      .find(e => e.innerText && e.innerText.trim().includes(txt));
    if (el) { el.click(); return true; }
    return false;
  }, selector, text);
  if (!clicked) throw new Error(`Couldn’t find <${selector}> containing "${text}"`);
}

async function syncAndPublish() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // load your manual-login cookies
  const cookies = JSON.parse(fs.readFileSync('cookies.json','utf8'));
  await page.setCookie(...cookies);

  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });
  
  // click your project
  await sleep(1000);
  await clickByText(page, 'a[href*="MotionLoop"]', 'MotionLoop');

  // click CMS
  await sleep(1000);
  await clickByText(page, 'button', 'CMS');

  // switch to Airtable
  await sleep(1000);
  await clickByText(page, 'span', 'Airtable');

  // Sync
  await sleep(1000);
  await clickByText(page, 'button', 'Sync');

  // Publish
  await sleep(1000);
  await clickByText(page, 'button', 'Publish');

  // wait a bit, then screenshot
  await sleep(3000);
  const img = await page.screenshot({ fullPage: true });
  await browser.close();
  return img;
}

app.post('/sync', async (_, res) => {
  try {
    const buffer = await syncAndPublish();
    const dataUrl = 'data:image/png;base64,' + buffer.toString('base64');
    return res.json({ success: true, screenshot: dataUrl });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (_, res) => res.send('🟢 Framer Auto-Publish is up'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
