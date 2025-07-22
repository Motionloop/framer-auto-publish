// index.js
import express from 'express';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Health check
app.get('/', (_req, res) => {
  res.send('✅ Framer Auto-Publish service is running');
});

// Serve the latest screenshot
app.get('/latest.png', (req, res) => {
  const img = path.join(__dirname, 'latest.png');
  if (fs.existsSync(img)) {
    res.sendFile(img);
  } else {
    res.status(404).send('No screenshot available yet');
  }
});

app.get('/publish', async (_req, res) => {
  console.log('🔔 /publish called');
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1) Log in
    await page.goto('https://framer.com/login', { waitUntil: 'load', timeout: 60000 });
    await page.click('button:has-text("Continue with Google")', { timeout: 30000 });
    await page.waitForURL(/accounts\.google\.com/, { timeout: 60000 });

    // Google SSO on same page
    await page.fill('input[type="email"]', process.env.GOOGLE_EMAIL, { timeout: 30000 });
    await page.click('button:has-text("Next")', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.fill('input[type="password"]', process.env.GOOGLE_PASSWORD, { timeout: 30000 });
    await page.click('button:has-text("Next")', { timeout: 30000 });
    await page.waitForLoadState('load', { timeout: 60000 });

    // 2) Navigate to your project & CMS
    await page.goto('https://framer.com/projects/', { waitUntil: 'load', timeout: 60000 });
    await page.click('text=MotionLoop Studio', { timeout: 60000 });
    await page.click('text=CMS',               { timeout: 60000 });

    // 3) Sync → Publish → Update
    await page.click('text=Sync',    { timeout: 60000 });
    await page.click('text=Publish', { timeout: 60000 });
    await page.waitForSelector('button:has-text("Update")', { timeout: 60000 });
    await page.click('button:has-text("Update")', { timeout: 60000 });
    console.log('✅ Update clicked');

    // 4) Screenshot the final state
    const buffer = await page.screenshot({ fullPage: true });
    fs.writeFileSync(path.join(__dirname, 'latest.png'), buffer);
    console.log('📸 Screenshot saved as latest.png');

    await browser.close();
    console.log('🏁 Done');
    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error in /publish:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
