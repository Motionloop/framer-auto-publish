// index.js
import express from 'express';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Health‐check
app.get('/', (_req, res) => {
  res.send('✅ Framer Auto-Publish service is running');
});

// Trigger Sync → Publish → Update
app.get('/publish', async (_req, res) => {
  console.log('🔔 /publish called');
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    page = await context.newPage();

    // 1) Go to Framer login & click Google SSO
    await page.goto('https://framer.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.click('button:has-text("Continue with Google")', { timeout: 60000 });

    // 2) Fill Google SSO form
    await page.waitForSelector('input[type="email"]', { timeout: 60000 });
    await page.fill('input[type="email"]', process.env.GOOGLE_EMAIL);
    await page.click('button:has-text("Next")', { timeout: 60000 });
    await page.waitForTimeout(2000);
    await page.waitForSelector('input[type="password"]', { timeout: 60000 });
    await page.fill('input[type="password"]', process.env.GOOGLE_PASSWORD);
    await page.click('button:has-text("Next")', { timeout: 60000 });
    await page.waitForLoadState('load', { timeout: 60000 });

    // 3) Navigate to your project & CMS
    await page.goto('https://framer.com/projects/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.click('text=MotionLoop Studio', { timeout: 60000 });
    await page.click('text=CMS',               { timeout: 60000 });
    
    // 4) Sync → Publish → Update
    await page.click('text=Sync',    { timeout: 60000 });
    await page.click('text=Publish', { timeout: 60000 });
    await page.waitForSelector('button:has-text("Update")', { timeout: 60000 });
    await page.click('button:has-text("Update")', { timeout: 60000 });

    await browser.close();
    console.log('🏁 Publish complete');
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error in /publish:', err.message);
    if (page) {
      try {
        await page.screenshot({ path: path.join(__dirname, 'latest.png'), fullPage: true });
        console.log('📸 Error screenshot saved');
      } catch {}
    }
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: err.message });
  }
});

// On‐demand screenshot of your Framer projects page
app.get('/latest.png', async (_req, res) => {
  console.log('🔔 /latest.png called');
  let browser, page;
  try {
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    page = await context.newPage();

    // Navigate to your projects page
    await page.goto('https://framer.com/projects/', { waitUntil: 'load', timeout: 60000 });
    // (Optional) log in here if the session expired

    const image = await page.screenshot({ fullPage: true });
    await browser.close();

    res.setHeader('Content-Type', 'image/png');
    return res.send(image);
  } catch (err) {
    console.error('❌ Screenshot error:', err.message);
    if (page) {
      try {
        const image = await page.screenshot({ fullPage: true });
        res.setHeader('Content-Type', 'image/png');
        return res.send(image);
      } catch {}
    }
    if (browser) await browser.close();
    return res.status(500).send('📸 Screenshot failed');
  }
});

app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
