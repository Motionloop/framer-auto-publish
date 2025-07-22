const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  // Load cookies
  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  // Step 1: Open Framer dashboard
  await page.goto('https://framer.com/projects', { waitUntil: 'networkidle2' });

  // Step 2: Click your project
  await page.waitForSelector('a[href*="MotionLoop-Studio"]');
  await page.click('a[href*="MotionLoop-Studio"]');

  // Step 3: Click CMS
  await page.waitForSelector('button:has-text("CMS")');
  await page.click('button:has-text("CMS")');

  // Step 4: Click Airtable
  await page.waitForSelector('span:text("Airtable")');
  await page.click('span:text("Airtable")');

  // Step 5: Sync
  await page.waitForSelector('button:has-text("Sync")', { timeout: 30000 });
  await page.click('button:has-text("Sync")');

  // Step 6: Publish
  await page.waitForSelector('button:has-text("Publish")', { timeout: 30000 });
  await page.click('button:has-text("Publish")');

  // Step 7: Screenshot after publish
  await page.waitForTimeout(3000); // wait to ensure UI updates
  await page.screenshot({ path: 'framer-publish-confirm.png', fullPage: true });

  console.log('✅ Synced, published, and screenshot saved');

  await browser.close();
})();
