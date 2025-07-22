const express = require('express');
const { chromium } = require('playwright');

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/publish', async (_, res) => {
  try {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1) Go to Framer login
    await page.goto('https://framer.com/login', { waitUntil: 'networkidle' });
    // 2) Click “Continue with Google”
    await page.click('button:has-text("Continue with Google")');

    // 3) Handle Google popup
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      // nothing else needed—the click above opens it
    ]);
    await popup.waitForLoadState('networkidle');

    // 4) Fill Google credentials from env
    await popup.fill('input[type="email"]', process.env.GOOGLE_EMAIL);
    await popup.click('button:has-text("Next")');
    await popup.waitForTimeout(1000);
    await popup.fill('input[type="password"]', process.env.GOOGLE_PASSWORD);
    await popup.click('button:has-text("Next")');
    await popup.waitForLoadState('networkidle');

    // 5) Back in Framer editor, wait for Projects to load
    await page.waitForURL('**/projects/**', { timeout: 30000 });

    // 6) Your workflow: open project, CMS, Sync, Publish
    await page.click('text=MotionLoop Studio');
    await page.click('text=CMS');
    await page.click('text=Sync');
    await page.click('text=Publish');

    await browser.close();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`▶️ Listening on port ${PORT}`));
