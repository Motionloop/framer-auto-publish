// index.js
import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 8080;

// Optional health‐check at root
app.get('/', (_req, res) => {
  res.send('✅ Framer Auto-Publish service is running');
});

app.get('/publish', async (_req, res) => {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1) Load the Framer login page
    await page.goto('https://framer.com/login', {
      waitUntil: 'load',
      timeout: 60000
    });

    // 2) Click “Continue with Google”
    await page.click('button:has-text("Continue with Google")', {
      timeout: 60000
    });

    // 3) Handle the Google popup
    const [popup] = await Promise.all([
      context.waitForEvent('page', { timeout: 60000 }),
      // The click above spawns the popup
    ]);
    await popup.waitForLoadState('load', { timeout: 60000 });

    // 4) Enter Google credentials from your Railway ENV
    await popup.fill('input[type="email"]', process.env.GOOGLE_EMAIL, {
      timeout: 60000
    });
    await popup.click('button:has-text("Next")', { timeout: 60000 });
    await popup.waitForTimeout(2000);
    await popup.fill('input[type="password"]', process.env.GOOGLE_PASSWORD, {
      timeout: 60000
    });
    await popup.click('button:has-text("Next")', { timeout: 60000 });
    await popup.waitForLoadState('load', { timeout: 60000 });

    // 5) Back in Framer, go to your project list
    await page.goto('https://framer.com/projects/', {
      waitUntil: 'load',
      timeout: 60000
    });

    // 6) Click through: project → CMS → Sync → Publish
    await page.click('text=MotionLoop Studio', { timeout: 60000 });
    await page.click('text=CMS', { timeout: 60000 });
    await page.click('text=Sync', { timeout: 60000 });
    await page.click('text=Publish', { timeout: 60000 });

    await browser.close();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
