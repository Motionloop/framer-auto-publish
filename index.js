const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Load cookies
  const cookies = JSON.parse(fs.readFileSync('cookies.json', 'utf8'));
  await page.setCookie(...cookies);

  // Go to your Framer project
  await page.goto('https://framer.com/projects/MotionLoop-Studio--HK5kUK0Zy8dDw1XQeqHw-cHtr6', {
    waitUntil: 'networkidle2',
  });

  console.log('🔍 Waiting for Sync button...');
  const [syncBtn] = await page.$x("//button[contains(., 'Sync')]");
  if (!syncBtn) throw new Error("Sync button not found");
  await syncBtn.click();
  console.log('✅ Clicked Sync');

  console.log('🔍 Waiting for Publish button...');
  const [publishBtn] = await page.$x("//button[contains(., 'Publish')]");
  if (!publishBtn) throw new Error("Publish button not found");
  await publishBtn.click();
  console.log('🚀 Clicked Publish');

  await page.waitForTimeout(5000);
  await browser.close();
})();
