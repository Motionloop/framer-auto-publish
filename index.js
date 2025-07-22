const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();

    const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
    await page.setCookie(...cookies);

    await page.goto('https://framer.com/projects/MotionLoop-Studio--HK5kUK0Zy8dDw1XQeqHw-cHtr6', {
      waitUntil: 'networkidle2',
    });

    console.log('🔍 Waiting for Sync button...');
    await page.waitForSelector('button:has-text("Sync")', { timeout: 30000 });

    await page.click('button:has-text("Sync")');
    console.log('✅ Clicked Sync');

    await page.waitForSelector('button:has-text("Publish")', { timeout: 30000 });
    await page.click('button:has-text("Publish")');
    console.log('🚀 Clicked Publish');

    await page.waitForTimeout(5000);
  } catch (err) {
    console.error('❌ Error occurred:', err);
    if (page) {
      await page.screenshot({ path: 'error.png', fullPage: true });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
