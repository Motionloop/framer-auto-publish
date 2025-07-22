import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/publish', async (req, res) => {
  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1) Log in
    await page.goto('https://framer.com/login', { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', process.env.FRAMER_EMAIL);
    await page.fill('input[name="password"]', process.env.FRAMER_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/projects/**');

    // 2) Click your project & CMS
    await page.click('text=MotionLoop Studio');
    await page.click('text=CMS');

    // 3) Sync & Publish
    await page.click('text=Sync');
    await page.click('text=Publish');

    await browser.close();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
