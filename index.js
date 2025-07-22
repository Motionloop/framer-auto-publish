// index.js
import express from 'express';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080;

// Existing routes here…

// ─── TEST ROUTE ─────────────────────────────────────────────────────────────
app.get('/test.png', async (_req, res) => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const page    = await context.newPage();

    // 1) Go to login
    await page.goto('https://framer.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // 2) Click “Continue with email”
    await page.click('button:has-text("Continue with email")', { timeout: 60000 });

    // 3) Screenshot
    const image = await page.screenshot({ fullPage: true });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    return res.send(image);
  } catch (err) {
    console.error('❌ /test.png error:', err);
    if (browser) await browser.close();
    return res.status(500).send('Test screenshot failed');
  }
});

app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
