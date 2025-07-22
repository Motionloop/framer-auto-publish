// index.js
const express   = require('express');
const fs        = require('fs');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

const PORT   = process.env.PORT || 8080;
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

async function clickByText(page, selector, text) {
  // find the first element matching selector whose innerText includes `text`
  const clicked = await page.evaluate(
    (sel, txt) => {
      const el = [...document.querySelectorAll(sel)]
        .find(e => e.innerText && e.innerText.trim().includes(txt));
      if (el) { el.click(); return true; }
      return false;
    },
    selector,
    text,
  );
  if (!clicked) throw new Error(`Could not find <${selector}> containing "${text}"`);
}

async function syncAndPublish() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // load cookies.json (from your manual login step)
  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  // navigate
  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });
  // click the MotionLoop link
  await clickByText(page, 'a[href*="MotionLoop"]', 'MotionLoop');  
  // click CMS
  await page.waitForTimeout(1000);
  await clickByText(page, 'button', 'CMS');
  // click Airtable tab
  await page.waitForTimeout(1000);
  await clickByText(page, 'span', 'Airtable');
  // click Sync
  await page.waitForTimeout(1000);
  await clickByText(page, 'button', 'Sync');
  // click Publish
  await page.waitForTimeout(1000);
  await clickByText(page, 'button', 'Publish');
  
  // give Framer a moment, screenshot for debugging
  await page.waitForTimeout(3000);
  const buffer = await page.screenshot({ fullPage: true });
  await browser.close();
  return buffer;
}

app.post('/sync', async (req, res) => {
  try {
    const imgBuf = await syncAndPublish();
    // send back a base64 data-URL you can preview:
    const dataUrl = 'data:image/png;base64,' + imgBuf.toString('base64');
    res.json({ success: true, screenshot: dataUrl });
  } catch (err) {
    console.error('❌ Sync error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (_, res) => res.send('🟢 Framer Auto-Publish running'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
