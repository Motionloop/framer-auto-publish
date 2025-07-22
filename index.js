// index.js
const express   = require('express');
const fs        = require('fs');
const path      = require('path');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.json());

// Serve any file in the project root (so latest.png & error.png are public)
app.use(express.static(process.cwd()));

const PORT   = process.env.PORT || 8080;
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function clickByText(page, selector, text) {
  return page.evaluate((sel, txt) => {
    const els = Array.from(document.querySelectorAll(sel));
    const el  = els.find(e => e.innerText && e.innerText.includes(txt));
    if (el) el.click();
    return !!el;
  }, selector, text);
}

async function syncAndPublish() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME,
    args: ['--no-sandbox','--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // load cookies
  const cookies = JSON.parse(fs.readFileSync('cookies.json','utf8'));
  await page.setCookie(...cookies);

  // start workflow
  await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });

  // click project
  await sleep(1000);
  if (!await clickByText(page, 'a[href*="MotionLoop"]', 'MotionLoop')) {
    throw new Error('Missing project link');
  }

  // click CMS
  await sleep(1000);
  if (!await clickByText(page, 'button, span, div', 'CMS')) {
    throw new Error('Missing CMS tab');
  }

  // click Airtable
  await sleep(1000);
  if (!await clickByText(page, 'span, button, div', 'Airtable')) {
    throw new Error('Missing Airtable tab');
  }

  // click Sync
  await sleep(1000);
  if (!await clickByText(page, 'button', 'Sync')) {
    throw new Error('Missing Sync button');
  }

  // click Publish
  await sleep(1000);
  if (!await clickByText(page, 'button', 'Publish')) {
    throw new Error('Missing Publish button');
  }

  // final screenshot on success
  await sleep(3000);
  const img = await page.screenshot({ fullPage: true });
  await browser.close();

  // write latest.png
  fs.writeFileSync('latest.png', img);
  return { success: true, screenshot: 'latest.png' };
}

app.post('/sync', async (req, res) => {
  try {
    const { success, screenshot } = await syncAndPublish();
    const url = `${req.protocol}://${req.get('host')}/${screenshot}`;
    return res.json({ success, screenshotUrl: url });
  } catch (err) {
    console.error('Sync error:', err);

    // on error, screenshot whatever is on screen
    let buffer;
    try {
      // note: `page` is out of scope here, so we must capture inside syncAndPublish catch instead
      // as a quick hack, re-launch and screenshot the projects page:
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: CHROME,
        args: ['--no-sandbox','--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto('https://framer.com/projects/', { waitUntil: 'networkidle2' });
      buffer = await page.screenshot({ fullPage: true });
      await browser.close();
    } catch (screenshotErr) {
      console.error('Error while capturing error screenshot:', screenshotErr);
      buffer = Buffer.from('');
    }

    fs.writeFileSync('error.png', buffer);
    const url = `${req.protocol}://${req.get('host')}/error.png`;
    return res
      .status(500)
      .json({ success: false, error: err.message, screenshotUrl: url });
  }
});

app.get('/', (_, res) => res.send('🟢 Framer Auto-Publish is up'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
