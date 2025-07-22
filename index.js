// index.js
import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/publish', async (req, res) => {
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1) Log in via Google SSO
    await page.goto('https://framer.com/login', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Continue with Google")');
    // Wait for the popup and complete Google login
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      // click above spawns the popup
    ]);
    await popup.waitForLoadState('networkidle');
    await popup.fill('input[type="email"]', process.env.GOOGLE_EMAIL);
    await popup.click('button:has-text("Next")');
    await popup.waitForTimeout(1000);
    await popup.fill('input[type="password"]', process.env.GOOGLE_PASSWORD);
    await popup.click('button:has-text("Next")');
    await popup.waitForLoadState('networkidle');

    // 2) Back in Framer editor, wait for projects to load
    await page.waitForURL('**/projects/**', { timeout: 30000 });

    // 3) Click your project & CMS, then Sync & Publish
    await page.click('text=MotionLoop Studio');
    await page.click('text=CMS');
    await page.click('text=Sync');
    await page.click('text=Publish');

    await browser.close();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
