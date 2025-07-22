// index.js
const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

// Serve any file in this folder (so latest.png is public)
app.use(express.static(process.cwd()));

const PORT   = process.env.PORT || 8080;
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function clickByText(page, text) {
  const ok = await page.evaluate(txt => {
    const els = Array.from(document.querySelectorAll('button, a, span, div'));
    const el  = els.find(e => e.innerText && e.innerText.includes(txt));
    if (el) { el.click(); return true; }
    return false;
  }, text);
  if (!ok) throw new Error(`Couldn’t find element containing “${text}”`);
}

async function syncAndPublish() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // load cookies.json
  const cookies = JSON.parse(fs.readFileSync('cookies.json','utf8'));
  await page.setCookie(...cookies);

  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });

  await sleep(1000);
  await clickByText(page, 'MotionLoop');  // your project link

  await sleep(1000);
  await clickByText(page, 'CMS');

  await sleep(1000);
  await clickByText(page, 'Airtable');

  await sleep(1000);
  await clickByText(page, 'Sync');

  await sleep(1000);
  await clickByText(page, 'Publish');

  await sleep(3000);
  const buffer = await page.screenshot({ fullPage: true });
  await browser.close();

  // write it out so Express can serve it
  const file = path.join(process.cwd(), 'latest.png');
  fs.writeFileSync(file, buffer);
  return file;
}

app.post('/sync', async (req, res) => {
  try {
    const filePath = await syncAndPublish();

    // build a full URL based on the current host
    const url = `${req.protocol}://${req.get('host')}/${path.basename(filePath)}`;
    return res.json({ success: true, screenshotUrl: url });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (_, res) => res.send('🟢 Framer Auto-Publish is up'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
