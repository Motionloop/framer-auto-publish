const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Load cookies
  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  // Go to your Framer project directly
  await page.goto('https://framer.com/projects/MotionLoop-Studio--HK5kUK0Zy8dDw1XQeqHw-cHtr6', {
    waitUntil: 'networkidle2',
  });

  console.log('🔍 Waiting for Sync button...');
  await page.waitForSelector('button:has-text("Sync")', { timeout: 30000 });

  // Click Sync
  await page.click('button:has-text("Sync")');
  console.log('✅ Clicked Sync');

  // Wait and click Publish
  await page.waitForSelector('button:has-text("Publish")', { timeout: 30000 });
  await page.click('button:has-text("Publish")');
  console.log('🚀 Clicked Publish');

  // Optional: wait before closing browser
  await page.waitForTimeout(5000);
  await browser.close();
})();
